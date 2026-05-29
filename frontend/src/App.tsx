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
    title: string;
    note: string;
  }>(null);

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
            rows={4}
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
        <div className="grid grid-4" style={{ marginBottom: 12 }}>
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
          <div />
        </div>

        {logsQuery.isLoading ? (
          <p>Загрузка...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Вид работ</th>
                <th>Объем</th>
                <th>Исполнитель</th>
                <th>Примечание</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {logsQuery.data?.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.date.slice(0, 10)}</td>
                  <td>{item.workTypeName}</td>
                  <td>
                    {item.volume} {item.unit}
                  </td>
                  <td>{item.executorName}</td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      onClick={() =>
                        setNoteModal({
                          title: `${item.workTypeName} - ${item.date.slice(0, 10)}`,
                          note: item.notes?.trim() || "Примечание отсутствует",
                        })
                      }
                    >
                      Примечание
                    </button>
                  </td>
                  <td>
                    <button
                      className="btn btn-danger"
                      onClick={() => deleteMutation.mutate(item.id)}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {noteModal ? (
        <div className="modal-backdrop" onClick={() => setNoteModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>{noteModal.title}</h3>
            <p>{noteModal.note}</p>
            <button
              className="btn btn-primary"
              onClick={() => setNoteModal(null)}
            >
              Закрыть
            </button>
          </div>
        </div>
      ) : null}

      {toast ? <div className="toast-message">{toast}</div> : null}
    </main>
  );
}
