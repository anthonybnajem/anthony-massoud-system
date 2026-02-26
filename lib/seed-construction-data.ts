/**
 * Seed construction-focused categories and products
 */

import {
  categoriesApi,
  customersApi,
  employeesApi,
  getDB,
  initializeDatabase,
  projectWorkerAssignmentsApi,
  projectsApi,
  salesApi,
  stockMovementsApi,
  productsApi,
  workersApi,
  type Category,
  type CustomerProfile,
  type CustomerProject,
  type Product,
  type ProjectWorkerAssignment,
  type Sale,
  type StockMovement,
  type Worker,
} from "./db";
import { getProductUnitPriceForVariation } from "./product-measurements";

type SeedVariation = {
  name: string;
  price: number;
  rentalPrice: number;
  stock: number;
};

type SeedProduct = {
  name: string;
  sku: string;
  categoryName: string;
  description: string;
  saleType: "item" | "weight" | "rental";
  unitLabel: string;
  unitIncrement: number;
  price: number;
  rentalPrice: number;
  stock: number;
  variations?: SeedVariation[];
};

type SeedCustomer = {
  name: string;
  phone?: string;
  email?: string;
  location?: string;
  notes?: string;
  projects: Array<{
    name: string;
    location?: string;
    notes?: string;
  }>;
};

type SeedSaleLine = {
  sku: string;
  quantity: number;
  variationName?: string;
};

type SeedSaleTemplate = {
  daysAgo: number;
  paymentMethod: "cash" | "credit" | "mobile";
  customerName?: string;
  projectName?: string;
  isRental?: boolean;
  rentalDays?: number;
  returnedAfterDays?: number;
  notes?: string;
  items: SeedSaleLine[];
};

type SeedWorker = {
  name: string;
  phone?: string;
  email?: string;
  specialty?: string;
  dailyRate: number;
  hourlyRate?: number;
  notes?: string;
  assignments: Array<{
    customerName: string;
    projectName: string;
    role?: string;
    startDaysAgo: number;
    endDaysAgo?: number;
    dailyRate?: number;
    notes?: string;
  }>;
};

export const CONSTRUCTION_CATEGORIES: Array<
  Omit<Category, "id"> & { key: string }
> = [
  {
    key: "cat_metals",
    name: "Metals & Rebar",
    description: "Steel bars, reinforcement materials, and metal products",
  },
  {
    key: "cat_wood",
    name: "Wood & Boards",
    description: "Plywood, timber, and carpentry materials",
  },
  {
    key: "cat_cement",
    name: "Cement & Concrete",
    description: "Cement, concrete mixes, and related products",
  },
  {
    key: "cat_aggregates",
    name: "Aggregates",
    description: "Sand, gravel, and base materials",
  },
  {
    key: "cat_tools",
    name: "Tools & Hardware",
    description: "Power tools, hand tools, and hardware",
  },
  {
    key: "cat_rental",
    name: "Rental Equipment",
    description: "Construction equipment available for rental",
  },
];

export const CONSTRUCTION_PRODUCTS: SeedProduct[] = [
  {
    name: "Metal Stick / Rebar",
    sku: "REBAR-STICK",
    categoryName: "Metals & Rebar",
    description: "General-purpose reinforcement steel bars by diameter",
    saleType: "item",
    unitLabel: "pc",
    unitIncrement: 1,
    price: 8,
    rentalPrice: 3,
    stock: 450,
    variations: [
      { name: "Rebar 4mm", price: 3.5, rentalPrice: 1.2, stock: 180 },
      { name: "Rebar 10mm", price: 7.5, rentalPrice: 2.5, stock: 140 },
      { name: "Rebar 12mm", price: 9.5, rentalPrice: 3.2, stock: 130 },
    ],
  },
  {
    name: "Threaded Rod",
    sku: "ROD-THREAD",
    categoryName: "Metals & Rebar",
    description: "All-thread steel rod used for fastening and anchoring",
    saleType: "item",
    unitLabel: "pc",
    unitIncrement: 1,
    price: 12,
    rentalPrice: 4,
    stock: 260,
    variations: [
      { name: "M8 x 1m", price: 6.5, rentalPrice: 2, stock: 90 },
      { name: "M10 x 1m", price: 8.2, rentalPrice: 2.7, stock: 90 },
      { name: "M12 x 1m", price: 10.1, rentalPrice: 3.4, stock: 80 },
    ],
  },
  {
    name: "Plywood Sheet 18mm",
    sku: "PLY-18MM",
    categoryName: "Wood & Boards",
    description: "Durable plywood sheet for formwork and interior works",
    saleType: "item",
    unitLabel: "sheet",
    unitIncrement: 1,
    price: 24,
    rentalPrice: 8,
    stock: 75,
  },
  {
    name: "Timber Beam",
    sku: "TIMBER-BEAM",
    categoryName: "Wood & Boards",
    description: "Structural timber beams in common dimensions",
    saleType: "item",
    unitLabel: "pc",
    unitIncrement: 1,
    price: 18,
    rentalPrice: 6,
    stock: 120,
    variations: [
      { name: "5x10 cm - 3m", price: 10, rentalPrice: 3, stock: 40 },
      { name: "8x16 cm - 3m", price: 19, rentalPrice: 6, stock: 40 },
      { name: "10x20 cm - 3m", price: 25, rentalPrice: 8, stock: 40 },
    ],
  },
  {
    name: "Portland Cement 50kg",
    sku: "CEMENT-50KG",
    categoryName: "Cement & Concrete",
    description: "Portland cement bag for general concrete works",
    saleType: "item",
    unitLabel: "bag",
    unitIncrement: 1,
    price: 7.5,
    rentalPrice: 2.5,
    stock: 300,
  },
  {
    name: "Ready Mix Concrete",
    sku: "CONC-READY",
    categoryName: "Cement & Concrete",
    description: "Ready-mix concrete sold by cubic meter",
    saleType: "weight",
    unitLabel: "m3",
    unitIncrement: 0.1,
    price: 95,
    rentalPrice: 95,
    stock: 120,
  },
  {
    name: "River Sand",
    sku: "SAND-RIVER",
    categoryName: "Aggregates",
    description: "Clean washed river sand for mortar and plaster",
    saleType: "weight",
    unitLabel: "m3",
    unitIncrement: 0.1,
    price: 28,
    rentalPrice: 28,
    stock: 240,
  },
  {
    name: "Crushed Gravel",
    sku: "GRAVEL-CRUSH",
    categoryName: "Aggregates",
    description: "Crushed gravel for concrete and base layers",
    saleType: "weight",
    unitLabel: "ton",
    unitIncrement: 0.1,
    price: 22,
    rentalPrice: 22,
    stock: 180,
  },
  {
    name: "Cordless Drill",
    sku: "DRILL-18V",
    categoryName: "Tools & Hardware",
    description: "18V cordless drill for site installation work",
    saleType: "item",
    unitLabel: "pc",
    unitIncrement: 1,
    price: 85,
    rentalPrice: 18,
    stock: 20,
  },
  {
    name: "Angle Grinder",
    sku: "GRINDER-125",
    categoryName: "Tools & Hardware",
    description: "125mm angle grinder for cutting and grinding metal",
    saleType: "item",
    unitLabel: "pc",
    unitIncrement: 1,
    price: 65,
    rentalPrice: 14,
    stock: 18,
  },
  {
    name: "Scaffolding Set",
    sku: "SCAFF-SET",
    categoryName: "Rental Equipment",
    description: "Modular scaffolding set for temporary work platforms",
    saleType: "rental",
    unitLabel: "day",
    unitIncrement: 1,
    price: 450,
    rentalPrice: 55,
    stock: 14,
  },
  {
    name: "Concrete Mixer",
    sku: "MIXER-350L",
    categoryName: "Rental Equipment",
    description: "350L concrete mixer for medium-size construction jobs",
    saleType: "rental",
    unitLabel: "day",
    unitIncrement: 1,
    price: 980,
    rentalPrice: 75,
    stock: 8,
  },
];

export const CONSTRUCTION_CUSTOMERS: SeedCustomer[] = [
  {
    name: "Al Noor Contracting",
    phone: "+961 70 110 001",
    email: "procurement@alnoor-contracting.com",
    location: "Zgharta",
    notes: "Priority B2B customer",
    projects: [
      {
        name: "Noor Tower Phase 1",
        location: "Tripoli",
        notes: "High rebar and cement demand",
      },
      {
        name: "Noor Villas Block A",
        location: "Zgharta",
      },
    ],
  },
  {
    name: "Cedar Build Co",
    phone: "+961 70 110 002",
    email: "site@cedarbuild.co",
    location: "Ehden",
    projects: [
      {
        name: "Cedar Heights Retaining Wall",
        location: "Ehden",
      },
    ],
  },
  {
    name: "Northline Engineering",
    phone: "+961 70 110 003",
    email: "projects@northline-eng.com",
    location: "Tripoli",
    projects: [
      {
        name: "Warehouse Foundation Upgrade",
        location: "Tripoli Industrial Zone",
      },
      {
        name: "Coastal Drainage Works",
        location: "Chekka",
      },
    ],
  },
  {
    name: "Haddad Renovations",
    phone: "+961 70 110 004",
    location: "Bcharre",
    projects: [
      {
        name: "Municipal Building Retrofit",
        location: "Bcharre",
      },
    ],
  },
];

export const CONSTRUCTION_SALES: SeedSaleTemplate[] = [
  {
    daysAgo: 21,
    paymentMethod: "cash",
    customerName: "Al Noor Contracting",
    projectName: "Noor Tower Phase 1",
    items: [
      { sku: "REBAR-STICK", variationName: "Rebar 12mm", quantity: 24 },
      { sku: "CEMENT-50KG", quantity: 30 },
    ],
    notes: "Foundation phase materials",
  },
  {
    daysAgo: 19,
    paymentMethod: "credit",
    customerName: "Cedar Build Co",
    projectName: "Cedar Heights Retaining Wall",
    items: [
      { sku: "REBAR-STICK", variationName: "Rebar 10mm", quantity: 20 },
      { sku: "SAND-RIVER", quantity: 12.5 },
    ],
  },
  {
    daysAgo: 16,
    paymentMethod: "mobile",
    customerName: "Northline Engineering",
    projectName: "Warehouse Foundation Upgrade",
    items: [
      { sku: "GRAVEL-CRUSH", quantity: 18 },
      { sku: "CONC-READY", quantity: 8.2 },
    ],
  },
  {
    daysAgo: 14,
    paymentMethod: "cash",
    customerName: "Haddad Renovations",
    projectName: "Municipal Building Retrofit",
    items: [
      { sku: "PLY-18MM", quantity: 14 },
      { sku: "TIMBER-BEAM", variationName: "8x16 cm - 3m", quantity: 18 },
    ],
  },
  {
    daysAgo: 11,
    paymentMethod: "credit",
    customerName: "Al Noor Contracting",
    projectName: "Noor Villas Block A",
    isRental: true,
    rentalDays: 5,
    returnedAfterDays: 6,
    items: [{ sku: "SCAFF-SET", quantity: 3 }],
    notes: "Temporary scaffolding rental",
  },
  {
    daysAgo: 9,
    paymentMethod: "credit",
    customerName: "Northline Engineering",
    projectName: "Coastal Drainage Works",
    isRental: true,
    rentalDays: 7,
    items: [{ sku: "MIXER-350L", quantity: 2 }],
    notes: "Mixer rental currently active",
  },
  {
    daysAgo: 7,
    paymentMethod: "cash",
    customerName: "Cedar Build Co",
    projectName: "Cedar Heights Retaining Wall",
    items: [
      { sku: "ROD-THREAD", variationName: "M10 x 1m", quantity: 40 },
      { sku: "GRINDER-125", quantity: 4 },
    ],
  },
  {
    daysAgo: 5,
    paymentMethod: "mobile",
    customerName: "Haddad Renovations",
    projectName: "Municipal Building Retrofit",
    isRental: true,
    rentalDays: 3,
    returnedAfterDays: 3,
    items: [{ sku: "DRILL-18V", quantity: 3 }],
  },
  {
    daysAgo: 3,
    paymentMethod: "cash",
    customerName: "Al Noor Contracting",
    projectName: "Noor Tower Phase 1",
    items: [
      { sku: "CEMENT-50KG", quantity: 42 },
      { sku: "SAND-RIVER", quantity: 10 },
      { sku: "REBAR-STICK", variationName: "Rebar 4mm", quantity: 50 },
    ],
  },
  {
    daysAgo: 1,
    paymentMethod: "credit",
    customerName: "Northline Engineering",
    projectName: "Warehouse Foundation Upgrade",
    items: [{ sku: "TIMBER-BEAM", variationName: "10x20 cm - 3m", quantity: 9 }],
  },
];

export const CONSTRUCTION_WORKERS: SeedWorker[] = [
  {
    name: "Khaled Daher",
    phone: "+961 70 220 101",
    specialty: "Rebar Installer",
    dailyRate: 45,
    notes: "Fast tying and bending for columns and slabs",
    assignments: [
      {
        customerName: "Al Noor Contracting",
        projectName: "Noor Tower Phase 1",
        role: "Rebar Team Lead",
        startDaysAgo: 24,
        dailyRate: 50,
      },
    ],
  },
  {
    name: "Rami Akl",
    phone: "+961 70 220 102",
    specialty: "Carpenter",
    dailyRate: 40,
    assignments: [
      {
        customerName: "Haddad Renovations",
        projectName: "Municipal Building Retrofit",
        role: "Formwork Carpenter",
        startDaysAgo: 18,
      },
      {
        customerName: "Northline Engineering",
        projectName: "Warehouse Foundation Upgrade",
        role: "Shoring Carpenter",
        startDaysAgo: 5,
      },
    ],
  },
  {
    name: "Fadi Matar",
    phone: "+961 70 220 103",
    specialty: "Concrete Technician",
    dailyRate: 55,
    assignments: [
      {
        customerName: "Cedar Build Co",
        projectName: "Cedar Heights Retaining Wall",
        role: "Concrete Pour Supervisor",
        startDaysAgo: 20,
        endDaysAgo: 6,
      },
    ],
  },
  {
    name: "Nabil Youssef",
    phone: "+961 70 220 104",
    specialty: "Equipment Operator",
    dailyRate: 60,
    assignments: [
      {
        customerName: "Northline Engineering",
        projectName: "Coastal Drainage Works",
        role: "Mixer Operator",
        startDaysAgo: 10,
      },
    ],
  },
];

export async function seedConstructionData(): Promise<{
  categoriesAdded: number;
  productsAdded: number;
  productsSkipped: number;
  customersAdded: number;
  customersSkipped: number;
  projectsAdded: number;
  projectsSkipped: number;
  workersAdded: number;
  workersSkipped: number;
  workerAssignmentsAdded: number;
  workerAssignmentsSkipped: number;
  salesAdded: number;
  salesSkipped: number;
  stockMovementsAdded: number;
}> {
  // Ensure DB is open
  try {
    const db = getDB();
    if (!db || !db.isOpen()) {
      throw new Error("Database not open");
    }
  } catch {
    const initialized = await initializeDatabase();
    if (!initialized) {
      throw new Error("Database initialization failed");
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  const existingCategories = await categoriesApi.getAll();
  const categoryMap = new Map<string, Category>();
  existingCategories.forEach((category) => {
    categoryMap.set(category.name.toLowerCase(), category);
  });

  let categoriesAdded = 0;
  for (const seedCategory of CONSTRUCTION_CATEGORIES) {
    const key = seedCategory.name.toLowerCase();
    if (categoryMap.has(key)) continue;
    const newCategory: Category = {
      id: crypto.randomUUID(),
      name: seedCategory.name,
      description: seedCategory.description,
      color: seedCategory.color,
      icon: seedCategory.icon,
    };
    await categoriesApi.add(newCategory);
    categoryMap.set(key, newCategory);
    categoriesAdded++;
  }

  const allProducts = await productsApi.getAll();
  const skuSet = new Set(
    allProducts
      .map((product) => product.sku?.trim().toLowerCase())
      .filter((sku): sku is string => Boolean(sku))
  );

  let productsAdded = 0;
  let productsSkipped = 0;

  for (const seedProduct of CONSTRUCTION_PRODUCTS) {
    const skuKey = seedProduct.sku.trim().toLowerCase();
    if (skuSet.has(skuKey)) {
      productsSkipped++;
      continue;
    }

    const category = categoryMap.get(seedProduct.categoryName.toLowerCase());
    if (!category) {
      throw new Error(`Category missing for product ${seedProduct.name}`);
    }

    const product: Product = {
      id: crypto.randomUUID(),
      name: seedProduct.name,
      sku: seedProduct.sku,
      categoryId: category.id,
      category,
      image: "",
      description: seedProduct.description,
      price: seedProduct.price,
      rentalPrice: seedProduct.rentalPrice,
      stock: seedProduct.stock,
      saleType: seedProduct.saleType,
      unitLabel: seedProduct.unitLabel,
      unitIncrement: seedProduct.unitIncrement,
      taxable: true,
      taxRate: 0,
      tags: ["construction", "seed"],
      variations: (seedProduct.variations || []).map((variation) => ({
        id: crypto.randomUUID(),
        name: variation.name,
        price: variation.price,
        rentalPrice: variation.rentalPrice,
        stock: variation.stock,
      })),
    };

    await productsApi.add(product);
    skuSet.add(skuKey);
    productsAdded++;
  }

  const existingCustomers = await customersApi.getAll();
  const customerMap = new Map<string, CustomerProfile>();
  existingCustomers.forEach((customer) => {
    const key = `${customer.name.trim().toLowerCase()}::${(
      customer.phone || ""
    )
      .trim()
      .toLowerCase()}`;
    customerMap.set(key, customer);
  });

  let customersAdded = 0;
  let customersSkipped = 0;
  let projectsAdded = 0;
  let projectsSkipped = 0;

  const allProjects = await projectsApi.getAll();
  const projectKeySet = new Set(
    allProjects.map(
      (project) =>
        `${project.customerId}::${project.name.trim().toLowerCase()}`
    )
  );

  for (const seedCustomer of CONSTRUCTION_CUSTOMERS) {
    const customerKey = `${seedCustomer.name.trim().toLowerCase()}::${(
      seedCustomer.phone || ""
    )
      .trim()
      .toLowerCase()}`;
    let customer = customerMap.get(customerKey);

    if (!customer) {
      customer = {
        id: crypto.randomUUID(),
        name: seedCustomer.name,
        phone: seedCustomer.phone,
        email: seedCustomer.email,
        location: seedCustomer.location,
        notes: seedCustomer.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await customersApi.add(customer);
      customerMap.set(customerKey, customer);
      customersAdded++;
    } else {
      customersSkipped++;
    }

    for (const seedProject of seedCustomer.projects) {
      const key = `${customer.id}::${seedProject.name.trim().toLowerCase()}`;
      if (projectKeySet.has(key)) {
        projectsSkipped++;
        continue;
      }

      const project: CustomerProject = {
        id: crypto.randomUUID(),
        customerId: customer.id,
        name: seedProject.name,
        location: seedProject.location,
        notes: seedProject.notes,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await projectsApi.add(project);
      projectKeySet.add(key);
      projectsAdded++;
    }
  }

  const seededProducts = await productsApi.getAll();
  const productBySku = new Map<string, Product>();
  seededProducts.forEach((product) => {
    if (product.sku) {
      productBySku.set(product.sku.trim().toLowerCase(), product);
    }
  });

  const seededCustomers = await customersApi.getAll();
  const customerByName = new Map<string, CustomerProfile>();
  seededCustomers.forEach((customer) => {
    customerByName.set(customer.name.trim().toLowerCase(), customer);
  });

  const seededProjects = await projectsApi.getAll();
  const projectByCustomerAndName = new Map<string, CustomerProject>();
  seededProjects.forEach((project) => {
    projectByCustomerAndName.set(
      `${project.customerId}::${project.name.trim().toLowerCase()}`,
      project
    );
  });

  const existingWorkers = await workersApi.getAll();
  const workerKeyToWorker = new Map<string, Worker>();
  existingWorkers.forEach((worker) => {
    const key = `${worker.name.trim().toLowerCase()}::${(
      worker.phone || ""
    )
      .trim()
      .toLowerCase()}`;
    workerKeyToWorker.set(key, worker);
  });

  let workersAdded = 0;
  let workersSkipped = 0;

  for (const seedWorker of CONSTRUCTION_WORKERS) {
    const workerKey = `${seedWorker.name.trim().toLowerCase()}::${(
      seedWorker.phone || ""
    )
      .trim()
      .toLowerCase()}`;

    if (workerKeyToWorker.has(workerKey)) {
      workersSkipped++;
      continue;
    }

    const worker: Worker = {
      id: crypto.randomUUID(),
      name: seedWorker.name,
      phone: seedWorker.phone,
      email: seedWorker.email,
      specialty: seedWorker.specialty,
      dailyRate: seedWorker.dailyRate,
      hourlyRate:
        seedWorker.hourlyRate ??
        Math.round((seedWorker.dailyRate / 8) * 100) / 100,
      notes: seedWorker.notes,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await workersApi.add(worker);
    workerKeyToWorker.set(workerKey, worker);
    workersAdded++;
  }

  const allWorkerAssignments = await projectWorkerAssignmentsApi.getAll();
  const assignmentKeySet = new Set(
    allWorkerAssignments.map(
      (assignment) =>
        `${assignment.projectId}::${assignment.workerId}::${new Date(
          assignment.startDate
        )
          .toISOString()
          .slice(0, 10)}`
    )
  );

  let workerAssignmentsAdded = 0;
  let workerAssignmentsSkipped = 0;

  const customerByNameForWorkers = new Map<string, CustomerProfile>();
  seededCustomers.forEach((customer) => {
    customerByNameForWorkers.set(customer.name.trim().toLowerCase(), customer);
  });

  for (const seedWorker of CONSTRUCTION_WORKERS) {
    const workerKey = `${seedWorker.name.trim().toLowerCase()}::${(
      seedWorker.phone || ""
    )
      .trim()
      .toLowerCase()}`;
    const worker = workerKeyToWorker.get(workerKey);
    if (!worker) continue;

    for (const assignmentTemplate of seedWorker.assignments) {
      const customer = customerByNameForWorkers.get(
        assignmentTemplate.customerName.trim().toLowerCase()
      );
      if (!customer) continue;

      const project = projectByCustomerAndName.get(
        `${customer.id}::${assignmentTemplate.projectName.trim().toLowerCase()}`
      );
      if (!project) continue;

      const startDate = new Date(
        Date.now() - assignmentTemplate.startDaysAgo * 24 * 60 * 60 * 1000
      );
      const assignmentKey = `${project.id}::${worker.id}::${startDate
        .toISOString()
        .slice(0, 10)}`;

      if (assignmentKeySet.has(assignmentKey)) {
        workerAssignmentsSkipped++;
        continue;
      }

      const endDate =
        typeof assignmentTemplate.endDaysAgo === "number"
          ? new Date(
              Date.now() - assignmentTemplate.endDaysAgo * 24 * 60 * 60 * 1000
            )
          : undefined;

      const assignment: ProjectWorkerAssignment = {
        id: crypto.randomUUID(),
        projectId: project.id,
        workerId: worker.id,
        role: assignmentTemplate.role,
        startDate,
        endDate,
        dailyRate: assignmentTemplate.dailyRate ?? seedWorker.dailyRate,
        status: endDate ? "completed" : "active",
        notes: assignmentTemplate.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await projectWorkerAssignmentsApi.add(assignment);
      assignmentKeySet.add(assignmentKey);
      workerAssignmentsAdded++;
    }
  }

  const employees = await employeesApi.getAll();
  const defaultEmployeeId = employees[0]?.id;

  const existingSales = await salesApi.getAll();
  const existingReceiptSet = new Set(
    existingSales
      .map((sale) => sale.receiptNumber?.trim())
      .filter((value): value is string => Boolean(value))
  );

  let salesAdded = 0;
  let salesSkipped = 0;
  let stockMovementsAdded = 0;

  const applyStockDelta = async (
    product: Product,
    quantityDelta: number,
    movementType: StockMovement["type"],
    date: Date,
    variationName?: string,
    reason?: string
  ) => {
    const current = productBySku.get((product.sku || "").trim().toLowerCase());
    if (!current) return;

    const previousProductStock = current.stock;
    let previousVariationStock: number | undefined;
    let nextVariationStock: number | undefined;
    let updatedVariations = current.variations || [];

    if (variationName) {
      updatedVariations = updatedVariations.map((variation) => {
        if (variation.name !== variationName) return variation;
        previousVariationStock = variation.stock;
        nextVariationStock = Math.max(0, variation.stock + quantityDelta);
        return { ...variation, stock: nextVariationStock };
      });
    }

    const nextProductStock = Math.max(0, previousProductStock + quantityDelta);
    const updatedProduct: Product = {
      ...current,
      stock: nextProductStock,
      variations: updatedVariations,
    };

    await productsApi.update(updatedProduct);
    productBySku.set((updatedProduct.sku || "").trim().toLowerCase(), updatedProduct);

    const movement: StockMovement = {
      id: crypto.randomUUID(),
      productId: updatedProduct.id,
      type: movementType,
      quantity: quantityDelta,
      previousStock:
        typeof previousVariationStock === "number"
          ? previousVariationStock
          : previousProductStock,
      newStock:
        typeof nextVariationStock === "number"
          ? nextVariationStock
          : nextProductStock,
      reason:
        reason ||
        (variationName
          ? `${movementType} (${variationName})`
          : movementType),
      notes: variationName ? `Variation: ${variationName}` : undefined,
      date,
    };

    await stockMovementsApi.add(movement);
    stockMovementsAdded++;
  };

  for (let index = 0; index < CONSTRUCTION_SALES.length; index++) {
    const template = CONSTRUCTION_SALES[index];
    const saleDate = new Date(
      Date.now() - template.daysAgo * 24 * 60 * 60 * 1000
    );
    const receiptNumber = `SEED-${saleDate
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "")}-${String(index + 1).padStart(3, "0")}`;

    if (existingReceiptSet.has(receiptNumber)) {
      salesSkipped++;
      continue;
    }

    const customer = template.customerName
      ? customerByName.get(template.customerName.trim().toLowerCase())
      : undefined;
    const project =
      customer && template.projectName
        ? projectByCustomerAndName.get(
            `${customer.id}::${template.projectName.trim().toLowerCase()}`
          )
        : undefined;

    const saleItems: Sale["items"] = [];
    for (const line of template.items) {
      const product = productBySku.get(line.sku.trim().toLowerCase());
      if (!product) continue;
      const variation = line.variationName
        ? product.variations?.find((item) => item.name === line.variationName)
        : undefined;
      const unitPrice = getProductUnitPriceForVariation(product, variation);

      saleItems.push({
        productId: product.id,
        quantity: line.quantity,
        price: unitPrice,
        variationId: variation?.id,
        variationName: variation?.name,
        isRental: Boolean(template.isRental),
        product,
      });
    }

    if (saleItems.length === 0) {
      salesSkipped++;
      continue;
    }

    const subtotal = saleItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const total = subtotal;

    const rentalStartDate = template.isRental ? saleDate : undefined;
    const rentalEndDate =
      template.isRental && template.rentalDays
        ? new Date(
            saleDate.getTime() + template.rentalDays * 24 * 60 * 60 * 1000
          )
        : undefined;
    const rentalReturnedAt =
      template.isRental && typeof template.returnedAfterDays === "number"
        ? new Date(
            saleDate.getTime() +
              template.returnedAfterDays * 24 * 60 * 60 * 1000
          )
        : undefined;

    const sale: Sale = {
      id: crypto.randomUUID(),
      items: saleItems,
      subtotal,
      tax: 0,
      discount: 0,
      total,
      paymentMethod: template.paymentMethod,
      date: saleDate,
      status: "completed",
      customerId: customer?.id,
      projectId: project?.id,
      customerName: customer?.name,
      customerEmail: customer?.email,
      customerPhone: customer?.phone,
      customerLocation: customer?.location,
      rentalStartDate,
      rentalEndDate,
      rentalStatus: template.isRental
        ? rentalReturnedAt
          ? "returned"
          : "active"
        : undefined,
      rentalReturnedAt,
      rentalReturnMode: rentalReturnedAt ? "manual" : undefined,
      receiptNumber,
      employeeId: defaultEmployeeId,
      notes: template.notes,
      updatedAt: saleDate,
    };

    await salesApi.add(sale);
    existingReceiptSet.add(receiptNumber);
    salesAdded++;

    for (const item of saleItems) {
      const product = item.product as Product | undefined;
      if (!product) continue;
      await applyStockDelta(
        product,
        -item.quantity,
        "sale",
        saleDate,
        item.variationName,
        template.isRental ? "Rental out" : "Sale out"
      );

      if (template.isRental && rentalReturnedAt) {
        await applyStockDelta(
          product,
          item.quantity,
          "return",
          rentalReturnedAt,
          item.variationName,
          "Rental return"
        );
      }
    }
  }

  return {
    categoriesAdded,
    productsAdded,
    productsSkipped,
    customersAdded,
    customersSkipped,
    projectsAdded,
    projectsSkipped,
    workersAdded,
    workersSkipped,
    workerAssignmentsAdded,
    workerAssignmentsSkipped,
    salesAdded,
    salesSkipped,
    stockMovementsAdded,
  };
}
