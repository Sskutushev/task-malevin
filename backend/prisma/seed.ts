import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const WORK_TYPES = [
  { name: "Кладка перегородок", unit: "м2" },
  { name: "Монтаж опалубки", unit: "м2" },
  { name: "Бетонирование", unit: "м3" },
  { name: "Армирование", unit: "т" },
  { name: "Кровельные работы", unit: "м2" },
  { name: "Штукатурные работы", unit: "м2" },
  { name: "Малярные работы", unit: "м2" },
  { name: "Устройство полов", unit: "м2" },
  { name: "Монтаж перекрытий", unit: "м2" },
  { name: "Земляные работы", unit: "м3" },
  { name: "Сварочные работы", unit: "п.м." },
  { name: "Монтаж металлоконструкций", unit: "т" },
  { name: "Устройство фундамента", unit: "м3" },
  { name: "Монтаж окон и дверей", unit: "шт." },
  { name: "Электромонтажные работы", unit: "п.м." },
  { name: "Сантехнические работы", unit: "п.м." },
  { name: "Демонтажные работы", unit: "м3" },
  { name: "Гидроизоляция", unit: "м2" },
  { name: "Утепление", unit: "м2" },
  { name: "Устройство лесов", unit: "м2" },
];

async function main(): Promise<void> {
  for (const workType of WORK_TYPES) {
    await prisma.workType.upsert({
      where: { name: workType.name },
      update: {},
      create: workType,
    });
  }
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
