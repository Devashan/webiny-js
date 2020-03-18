import { graphql } from "graphql";
import createCategories from "../data/createCategories";

export default ({ setupSchema }) => {
    describe("Resolvers", () => {
        let categories;
        let targetResult;
        let Category;

        beforeEach(async () => {
            // Insert demo data via models
            const { context } = await setupSchema();

            Category = context.models.category;
            categories = await createCategories(context);

            targetResult = {
                data: {
                    id: categories[0].model.id,
                    title: categories[0].model.title.value(),
                    slug: categories[0].model.slug.value()
                }
            };
        });

        afterEach(async () => {
            const entries = await Category.find();
            for (let i = 0; i < entries.length; i++) {
                await entries[i].delete();
            }
        });

        test(`get entry by ID`, async () => {
            // Test resolvers
            const query = /* GraphQL */ `
                query GetCategory($id: ID) {
                    getCategory(where: { id: $id }) {
                        data {
                            id
                            title
                            slug
                        }
                        error {
                            code
                            message
                        }
                    }
                }
            `;

            const { schema, context } = await setupSchema();

            const { data, errors } = await graphql(schema, query, {}, context, {
                id: categories[0].model.id
            });

            if (errors) {
                throw Error(JSON.stringify(errors, null, 2));
            }

            expect(data.getCategory).toMatchObject(targetResult);
        });

        test(`get entry by slug (default locale matches slug)`, async () => {
            // Test resolvers
            const query = /* GraphQL */ `
                query GetCategory($slug: String) {
                    getCategory(where: { slug: $slug }) {
                        data {
                            id
                            title
                            slug
                        }
                    }
                }
            `;

            const { schema, context } = await setupSchema();
            const { data } = await graphql(schema, query, {}, context, {
                slug: "hardware-en"
            });

            expect(data.getCategory).toMatchObject(targetResult);
        });

        test(`get entry by slug (default locale doesn't match slug)`, async () => {
            // Test resolvers
            const query = /* GraphQL */ `
                query GetCategory($slug: String) {
                    getCategory(where: { slug: $slug }) {
                        data {
                            id
                            title
                            slug
                        }
                    }
                }
            `;

            const { schema, context } = await setupSchema();
            const { data } = await graphql(schema, query, {}, context, {
                slug: "hardware-de"
            });

            expect(data.getCategory.data).toBe(null);
        });

        test(`get entry by slug (specific locale)`, async () => {
            // Test resolvers
            const query = /* GraphQL */ `
                query GetCategory($locale: String, $slug: String) {
                    getCategory(locale: $locale, where: { slug: $slug }) {
                        data {
                            id
                            title
                            slug
                        }
                    }
                }
            `;

            const { schema, context } = await setupSchema();
            const { data } = await graphql(schema, query, {}, context, {
                slug: "hardware-de",
                locale: "de-DE"
            });

            expect(data.getCategory).toMatchObject({
                data: {
                    id: categories[0].model.id,
                    title: "Hardware DE",
                    slug: "hardware-de"
                }
            });
        });

        test(`get entry by slug with field locale override`, async () => {
            // Test resolvers
            const query = /* GraphQL */ `
                query GetCategory($slug: String) {
                    getCategory(where: { slug: $slug }) {
                        data {
                            id
                            title
                            deTitle: title(locale: "de-DE")
                            enSlug: slug
                            deSlug: slug(locale: "de-DE")
                        }
                    }
                }
            `;

            const { schema, context } = await setupSchema();
            const { data } = await graphql(schema, query, {}, context, {
                slug: "hardware-en"
            });

            expect(data.getCategory).toMatchObject({
                data: {
                    id: categories[0].model.id,
                    title: "Hardware EN",
                    deTitle: "Hardware DE",
                    enSlug: "hardware-en",
                    deSlug: "hardware-de"
                }
            });
        });

        test(`list entries (no parameters)`, async () => {
            // Test resolvers
            const query = /* GraphQL */ `
                {
                    listCategories {
                        data {
                            id
                            title
                            slug
                        }
                    }
                }
            `;

            const { schema, context } = await setupSchema();
            const { data } = await graphql(schema, query, {}, context);
            expect(data.listCategories).toMatchObject({
                data: expect.arrayContaining([
                    expect.objectContaining({
                        id: expect.stringMatching(/^[0-9a-fA-F]{24}$/),
                        title: expect.stringMatching(/^A Category EN|B Category EN|Hardware EN$/),
                        slug: expect.stringMatching(/^a-category-en|b-category-en|hardware-en$/)
                    })
                ])
            });
        });

        test(`list entries (specific locale)`, async () => {
            // Test resolvers
            const query = /* GraphQL */ `
                {
                    listCategories(locale: "de-DE") {
                        data {
                            id
                            title
                            slug
                        }
                    }
                }
            `;

            const { schema, context } = await setupSchema();
            const { data } = await graphql(schema, query, {}, context);
            expect(data.listCategories).toMatchObject({
                data: expect.arrayContaining([
                    expect.objectContaining({
                        id: expect.stringMatching(/^[0-9a-fA-F]{24}$/),
                        title: expect.stringMatching(/^A Category DE|B Category DE|Hardware DE$/),
                        slug: expect.stringMatching(/^a-category-de|b-category-de|hardware-de/)
                    })
                ])
            });
        });

        test(`list entries (perPage)`, async () => {
            // Test resolvers
            const query = /* GraphQL */ `
                {
                    listCategories(perPage: 1) {
                        data {
                            id
                        }
                        meta {
                            totalCount
                            totalPages
                        }
                    }
                }
            `;

            const { schema, context } = await setupSchema();
            const { data } = await graphql(schema, query, {}, context);
            expect(data.listCategories).toMatchObject({
                data: expect.arrayContaining([
                    expect.objectContaining({
                        id: expect.stringMatching(/^[0-9a-fA-F]{24}$/)
                    })
                ]),
                meta: {
                    totalCount: 3,
                    totalPages: 3
                }
            });
        });

        test(`list entries (page)`, async () => {
            // Test resolvers
            const query = /* GraphQL */ `
                query ListCategories($page: Int) {
                    listCategories(page: $page, perPage: 1) {
                        data {
                            title
                        }
                        meta {
                            nextPage
                            previousPage
                            totalCount
                            totalPages
                        }
                    }
                }
            `;

            const { schema, context } = await setupSchema();
            const { data: data1, errors: errors1 } = await graphql(schema, query, {}, context, {
                page: 2
            });

            if (errors1) {
                throw Error(JSON.stringify(errors1, null, 2));
            }

            expect(data1.listCategories).toMatchObject({
                data: [
                    {
                        title: "A Category EN"
                    }
                ],
                meta: {
                    nextPage: 3,
                    previousPage: 1,
                    totalCount: 3,
                    totalPages: 3
                }
            });

            const { data: data2, errors: errors2 } = await graphql(schema, query, {}, context, {
                page: 3
            });

            if (errors2) {
                throw Error(JSON.stringify(errors2, null, 2));
            }

            expect(data2.listCategories).toMatchObject({
                data: [
                    {
                        title: "Hardware EN"
                    }
                ],
                meta: {
                    nextPage: null,
                    previousPage: 2,
                    totalCount: 3,
                    totalPages: 3
                }
            });
        });

        test(`list entries (sort ASC)`, async () => {
            // Test resolvers
            const query = /* GraphQL */ `
                query ListCategories($sort: [CategoryListSorter]) {
                    listCategories(sort: $sort) {
                        data {
                            title
                        }
                    }
                }
            `;

            const { schema, context } = await setupSchema();
            const { data } = await graphql(schema, query, {}, context, {
                sort: ["title_ASC"]
            });
            expect(data.listCategories).toMatchObject({
                data: [
                    {
                        title: "A Category EN"
                    },
                    {
                        title: "B Category EN"
                    },
                    {
                        title: "Hardware EN"
                    }
                ]
            });
        });

        test(`list entries (sort DESC)`, async () => {
            // Test resolvers
            const query = /* GraphQL */ `
                query ListCategories($sort: [CategoryListSorter]) {
                    listCategories(sort: $sort) {
                        data {
                            title
                        }
                    }
                }
            `;

            const { schema, context } = await setupSchema();
            const { data } = await graphql(schema, query, {}, context, {
                sort: ["title_DESC"]
            });
            expect(data.listCategories).toMatchObject({
                data: [
                    {
                        title: "Hardware EN"
                    },
                    {
                        title: "B Category EN"
                    },
                    {
                        title: "A Category EN"
                    }
                ]
            });
        });

        test(`list entries (contains, not_contains, in, not_in)`, async () => {
            // Test resolvers
            const query = /* GraphQL */ `
                query ListCategories($where: CategoryListWhereInput) {
                    listCategories(where: $where) {
                        data {
                            title
                        }
                    }
                }
            `;

            const { schema, context } = await setupSchema();
            const { data: data1 } = await graphql(schema, query, {}, context, {
                where: { title_contains: "category" }
            });
            expect(data1.listCategories.data.length).toBe(2);

            const { data: data2 } = await graphql(schema, query, {}, context, {
                where: { title_not_contains: "category" }
            });
            expect(data2.listCategories.data.length).toBe(1);

            const { data: data3 } = await graphql(schema, query, {}, context, {
                where: { title_in: ["B Category EN"] }
            });
            expect(data3.listCategories.data.length).toBe(1);

            const { data: data4 } = await graphql(schema, query, {}, context, {
                where: { title_not_in: ["A Category EN", "B Category EN"] }
            });
            expect(data4.listCategories.data.length).toBe(1);
            expect(data4.listCategories.data[0].title).toBe("Hardware EN");
        });
    });
};
