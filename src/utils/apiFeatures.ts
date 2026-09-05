export interface APIFeaturesOptions {
  searchFields?: string[];
}

export class PrismaAPIFeatures {
  private queryString: Record<string, any>;
  private options: APIFeaturesOptions;

  public where: Record<string, any> = {};
  public orderBy: Record<string, any>[] = [];
  public select?: Record<string, boolean>;
  public take: number = 10;
  public skip: number = 0;
  public page: number = 1;

  constructor(
    queryString: Record<string, any>,
    options: APIFeaturesOptions = {},
  ) {
    this.queryString = queryString;
    this.options = options;
  }

  filter(): this {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields", "search"];
    excludedFields.forEach((field) => delete queryObj[field]);

    const andConditions: any[] = [];

    if (this.queryString.search && this.options.searchFields?.length) {
      const searchTerm = String(this.queryString.search).trim();
      andConditions.push({
        OR: this.options.searchFields.map((field) => ({
          [field]: { contains: searchTerm, mode: "insensitive" },
        })),
      });
    }

    Object.keys(queryObj).forEach((key) => {
      const value = queryObj[key];

      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        const filterOperators: Record<string, any> = {};

        Object.keys(value).forEach((op) => {
          if (["gt", "gte", "lt", "lte"].includes(op)) {
            const parsedVal = isNaN(Number(value[op]))
              ? value[op]
              : Number(value[op]);
            filterOperators[op] = parsedVal;
          } else if (op === "in") {
            filterOperators["in"] = Array.isArray(value[op])
              ? value[op]
              : String(value[op]).split(",");
          } else {
            filterOperators[op] = value[op];
          }
        });

        andConditions.push({ [key]: filterOperators });
      } else {
        let parsedVal = value;
        if (value === "true") parsedVal = true;
        if (value === "false") parsedVal = false;

        andConditions.push({ [key]: parsedVal });
      }
    });

    if (andConditions.length > 0) {
      this.where = { AND: andConditions };
    }

    return this;
  }

  sort(): this {
    if (this.queryString.sort) {
      const fields = String(this.queryString.sort).split(",");
      this.orderBy = fields.map((field) => {
        if (field.startsWith("-")) {
          return { [field.slice(1)]: "desc" };
        }
        return { [field]: "asc" };
      });
    } else {
      this.orderBy = [{ createdAt: "desc" }];
    }
    return this;
  }

  limitFields(): this {
    if (this.queryString.fields) {
      const fields = String(this.queryString.fields).split(",");
      this.select = {};
      fields.forEach((field) => {
        if (this.select) this.select[field.trim()] = true;
      });
    }
    return this;
  }

  paginate(): this {
    this.page = Math.max(1, parseInt(this.queryString.page, 10) || 1);
    this.take = Math.max(1, parseInt(this.queryString.limit, 10) || 10);
    this.skip = (this.page - 1) * this.take;

    return this;
  }

  build() {
    const queryArgs: any = {
      where: this.where,
      orderBy: this.orderBy,
      take: this.take,
      skip: this.skip,
    };

    if (this.select && Object.keys(this.select).length > 0) {
      queryArgs.select = this.select;
    }

    return queryArgs;
  }
}
