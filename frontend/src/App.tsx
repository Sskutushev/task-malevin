import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { workLogsApi } from "./api/workLogsApi";
import { workTypesApi } from "./api/workTypesApi";
import { ApiClientError } from "./api/client";

const formSchema = z.object({
  date: z.string().min(1),
  workTypeId: z.string().min(1),
  volume: z.coerce.number().positive(),
  executorName: z.string().min(2),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function App(): JSX.Element {
  const qc = useQueryClient();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [createGroup, setCreateGroup] = useState("");
  const [groupError, setGroupError] = useState(false);
  const [toast, setToast] = useState("");
  const [noteModal, setNoteModal] = useState<null | {
    date: string;
    workTypeName: string;
    workTypeGroup: string;
    note: string;
  }>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<
    "date" | "workTypeName" | "volume" | "executorName"
  >("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const logsQuery = useQuery({
    queryKey: ["work-logs", dateFrom, dateTo],
    queryFn: () =>
      workLogsApi.getAll({
        dateFrom,
        dateTo,
        workTypeGroup: groupFilter,
        sortBy: "date",
        sortOrder: "desc",
      }),
  });

  const workTypesQuery = useQuery({
    queryKey: ["work-types"],
    queryFn: () => workTypesApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: workLogsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["work-logs"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: workLogsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["work-logs"] }),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: "",
      workTypeId: "",
      volume: 0,
      executorName: "",
      notes: "",
    },
  });
  const {
    formState: { errors, submitCount },
  } = form;
  const showErrors = submitCount > 0;

  const selectedWorkTypeId = useWatch({
    control: form.control,
    name: "workTypeId",
  });

  const selectedWorkType = useMemo(
    () => workTypesQuery.data?.find((x) => x.id === selectedWorkTypeId),
    [selectedWorkTypeId, workTypesQuery.data],
  );

  const groups = useMemo(
    () =>
      Array.from(new Set((workTypesQuery.data ?? []).map((x) => x.groupName))),
    [workTypesQuery.data],
  );

  const groupedWorkTypes = useMemo(() => {
    const map = new Map<string, typeof workTypesQuery.data>();
    for (const type of workTypesQuery.data ?? []) {
      const list = map.get(type.groupName) ?? [];
      list.push(type);
      map.set(type.groupName, list);
    }
    return map;
  }, [workTypesQuery.data]);

  const createGroupTypes = useMemo(
    () => groupedWorkTypes.get(createGroup) ?? [],
    [groupedWorkTypes, createGroup],
  );

  const createError = useMemo(() => {
    if (!createMutation.isError) return "";
    const error = createMutation.error;
    if (error instanceof ApiClientError && error.details) {
      return `${error.message}: ${JSON.stringify(error.details)}`;
    }
    return (error as Error).message;
  }, [createMutation.error, createMutation.isError]);

  const displayedItems = useMemo(() => {
    const items = [...(logsQuery.data?.items ?? [])];
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const searched = normalizedSearch
      ? items.filter((item) => {
          const executor = item.executorName.toLowerCase();
          const workType = item.workTypeName.toLowerCase();
          const volume = `${item.volume} ${item.unit}`.toLowerCase();
          return (
            executor.includes(normalizedSearch) ||
            workType.includes(normalizedSearch) ||
            volume.includes(normalizedSearch)
          );
        })
      : items;

    searched.sort((a, b) => {
      if (sortField === "date") {
        const aTime = new Date(a.date).getTime();
        const bTime = new Date(b.date).getTime();
        return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
      }
      if (sortField === "volume") {
        return sortDirection === "asc"
          ? a.volume - b.volume
          : b.volume - a.volume;
      }
      const aVal = (a[sortField] as string).toLowerCase();
      const bVal = (b[sortField] as string).toLowerCase();
      return sortDirection === "asc"
        ? aVal.localeCompare(bVal, "ru")
        : bVal.localeCompare(aVal, "ru");
    });

    return searched;
  }, [logsQuery.data?.items, searchTerm, sortField, sortDirection]);

  const setToastMessage = (message: string): void => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const onSubmit = form.handleSubmit(
    async (values) => {
      if (!createGroup) {
        setGroupError(true);
        setToastMessage("Выберите сегмент работ");
        return;
      }
      await createMutation.mutateAsync({
        ...values,
        unit: selectedWorkType?.unit ?? "",
      });
      form.reset({
        date: "",
        workTypeId: "",
        volume: 0,
        executorName: "",
        notes: "",
      });
      setCreateGroup("");
      setGroupError(false);
      setToastMessage("Запись успешно добавлена");
    },
    () => {
      setToastMessage("Заполните обязательные поля");
    },
  );

  const inputClass = (hasError: boolean, hasValue: boolean): string => {
    if (hasError) return "input field-error";
    if (hasValue) return "input field-ok";
    return "input";
  };

  const selectClass = (hasError: boolean, hasValue: boolean): string => {
    if (hasError) return "select field-error";
    if (hasValue) return "select field-ok";
    return "select";
  };

  const toggleSort = (
    field: "date" | "workTypeName" | "volume" | "executorName",
  ): void => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortDirection(field === "date" ? "desc" : "asc");
  };

  const toggleRow = (id: string): void => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleAllDisplayed = (): void => {
    const ids = displayedItems.map((item) => item.id);
    const allSelected =
      ids.length > 0 && ids.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      return;
    }
    setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const removeSelected = async (): Promise<void> => {
    if (selectedIds.length === 0) return;
    await Promise.all(selectedIds.map((id) => workLogsApi.delete(id)));
    setSelectedIds([]);
    await qc.invalidateQueries({ queryKey: ["work-logs"] });
    setToastMessage("Выбранные записи удалены");
  };

  return (
    <main className="container">
      <h1>Журнал работ</h1>

      <section className="card" style={{ marginBottom: 16 }}>
        <h2>Новая запись</h2>
        <form onSubmit={onSubmit} className="grid grid-4 form-grid">
          <input
            className={inputClass(
              !!errors.date && showErrors,
              !!form.watch("date"),
            )}
            type="date"
            {...form.register("date")}
          />
          <select
            className={selectClass(groupError && showErrors, !!createGroup)}
            value={createGroup}
            onChange={(e) => {
              setCreateGroup(e.target.value);
              setGroupError(false);
              form.setValue("workTypeId", "");
              form.clearErrors("workTypeId");
            }}
          >
            <option value="">Выберите сегмент работ</option>
            {groups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
          <select
            className={selectClass(
              !!errors.workTypeId && showErrors,
              !!form.watch("workTypeId"),
            )}
            {...form.register("workTypeId")}
          >
            <option value="">Выберите вид работ</option>
            {createGroupTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name} ({type.unit})
              </option>
            ))}
          </select>
          <input
            className={inputClass(
              !!errors.volume && showErrors,
              Number(form.watch("volume")) > 0,
            )}
            type="number"
            step="0.01"
            {...form.register("volume", { valueAsNumber: true })}
            placeholder={
              selectedWorkType?.quantityHint ??
              "Введите объем выполненных работ"
            }
          />
          <textarea
            className="input notes-input"
            placeholder="Примечание"
            {...form.register("notes")}
            style={{ gridColumn: "1 / span 3", gridRow: "2 / span 2" }}
            rows={1}
          />
          <input
            className={inputClass(
              !!errors.executorName && showErrors,
              !!form.watch("executorName"),
            )}
            placeholder="Исполнитель"
            {...form.register("executorName")}
            data-role="executor-input"
            style={{ gridColumn: "4", gridRow: "2" }}
          />
          <button
            className="btn btn-primary fixed-add-btn"
            type="submit"
            disabled={createMutation.isPending}
            style={{ gridColumn: "4", gridRow: "3" }}
          >
            Добавить
          </button>
        </form>
        {createError ? (
          <p style={{ color: "#b91c1c", marginTop: 8 }}>{createError}</p>
        ) : null}
      </section>

      <section className="card">
        <h2>Записи</h2>
        <div style={{ marginBottom: 12 }}>
          <input
            className="input"
            placeholder="Поиск: исполнитель, вид работ, объем"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filters-row" style={{ marginBottom: 12 }}>
          <input
            className="input"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <input
            className="input"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          <select
            className="select"
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
          >
            <option value="">Все группы работ</option>
            {groups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
          <button
            className="btn btn-danger bulk-remove-btn"
            type="button"
            disabled={selectedIds.length === 0}
            onClick={removeSelected}
          >
            Удалить все выбранные
          </button>
        </div>

        {logsQuery.isLoading ? (
          <p>Загрузка...</p>
        ) : (
          <div className="records-table-wrap">
            <table className="records-table">
              <colgroup>
                <col style={{ width: "36px" }} />
                <col style={{ width: "120px" }} />
                <col />
                <col style={{ width: "110px" }} />
                <col style={{ width: "220px" }} />
                <col style={{ width: "250px" }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="checkbox-col">
                    <input
                      type="checkbox"
                      checked={
                        displayedItems.length > 0 &&
                        displayedItems.every((item) =>
                          selectedIds.includes(item.id),
                        )
                      }
                      onChange={toggleAllDisplayed}
                    />
                  </th>
                  <th>
                    <button
                      className="sort-btn"
                      type="button"
                      onClick={() => toggleSort("date")}
                    >
                      Дата{" "}
                      {sortField === "date"
                        ? sortDirection === "asc"
                          ? "↑"
                          : "↓"
                        : "↕"}
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-btn"
                      type="button"
                      onClick={() => toggleSort("workTypeName")}
                    >
                      Вид работ{" "}
                      {sortField === "workTypeName"
                        ? sortDirection === "asc"
                          ? "↑"
                          : "↓"
                        : "↕"}
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-btn"
                      type="button"
                      onClick={() => toggleSort("volume")}
                    >
                      Объем{" "}
                      {sortField === "volume"
                        ? sortDirection === "asc"
                          ? "↑"
                          : "↓"
                        : "↕"}
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-btn"
                      type="button"
                      onClick={() => toggleSort("executorName")}
                    >
                      Исполнитель{" "}
                      {sortField === "executorName"
                        ? sortDirection === "asc"
                          ? "↑"
                          : "↓"
                        : "↕"}
                    </button>
                  </th>
                  <th>Примечание</th>
                </tr>
              </thead>
              <tbody>
                {displayedItems.map((item) => (
                  <tr key={item.id}>
                    <td className="checkbox-col">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleRow(item.id)}
                      />
                    </td>
                    <td className="date-col">{item.date.slice(0, 10)}</td>
                    <td className="work-col">
                      <span className="truncate-text" title={item.workTypeName}>
                        {item.workTypeName}
                      </span>
                    </td>
                    <td>
                      {item.volume} {item.unit}
                    </td>
                    <td className="executor-col">
                      <span className="truncate-text" title={item.executorName}>
                        {item.executorName}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions-inline">
                        <button
                          className="btn btn-secondary"
                          onClick={() =>
                            setNoteModal({
                              date: item.date.slice(0, 10),
                              workTypeName: item.workTypeName,
                              workTypeGroup: item.workTypeGroup,
                              note:
                                item.notes?.trim() || "Примечание отсутствует",
                            })
                          }
                        >
                          Примечание
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => deleteMutation.mutate(item.id)}
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {noteModal ? (
        <div className="modal-backdrop" onClick={() => setNoteModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{noteModal.workTypeName}</h3>
                <p className="modal-subtitle">{noteModal.date}</p>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => setNoteModal(null)}
              >
                Закрыть
              </button>
            </div>
            <div className="modal-group-tag">
              Сегмент: {noteModal.workTypeGroup}
            </div>
            <div className="modal-note-box">
              <p>{noteModal.note}</p>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? <div className="toast-message">{toast}</div> : null}
    </main>
  );
}
