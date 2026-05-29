import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { workLogsApi } from "./api/workLogsApi";
import { workTypesApi } from "./api/workTypesApi";

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

  const logsQuery = useQuery({
    queryKey: ["work-logs", dateFrom, dateTo],
    queryFn: () =>
      workLogsApi.getAll({
        dateFrom,
        dateTo,
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

  const selectedWorkType = useMemo(
    () => workTypesQuery.data?.find((x) => x.id === form.watch("workTypeId")),
    [form, workTypesQuery.data],
  );

  const onSubmit = form.handleSubmit(async (values) => {
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
  });

  return (
    <main className="container">
      <h1>Журнал работ</h1>

      <section className="card" style={{ marginBottom: 16 }}>
        <h2>Новая запись</h2>
        <form onSubmit={onSubmit} className="grid grid-4">
          <input className="input" type="date" {...form.register("date")} />
          <select className="select" {...form.register("workTypeId")}>
            <option value="">Выберите вид работ</option>
            {workTypesQuery.data?.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name} ({type.unit})
              </option>
            ))}
          </select>
          <input
            className="input"
            type="number"
            step="0.01"
            {...form.register("volume")}
          />
          <input
            className="input"
            placeholder="Исполнитель"
            {...form.register("executorName")}
          />
          <input
            className="input"
            placeholder="Примечание"
            {...form.register("notes")}
            style={{ gridColumn: "1 / span 3" }}
          />
          <button
            className="btn btn-primary"
            type="submit"
            disabled={createMutation.isPending}
          >
            Добавить
          </button>
        </form>
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
          <div />
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
    </main>
  );
}
