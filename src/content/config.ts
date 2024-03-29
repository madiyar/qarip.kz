import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	schema: ({ image }) => z.object({
		title: z.string(),
		url: z.string(),
		cover: image(),
		author: z.string().optional(),
		pubDate: z
			.string()
			.or(z.date())
			.transform((val) => new Date(val)),
		updatedDate: z
			.string()
			.optional()
			.transform((str) => (str ? new Date(str) : undefined)),
	}),
});

const qaripter = defineCollection({
	schema: z.object({
		title: z.string(),
		author: z.string(),
		url: z.string(),
		download: z.string(),
		summary: z.string().optional(),
		tags: z.array(z.enum(['serif', 'sans-serif', 'display', 'free', 'our'])),
		files: z.array(z.object({
			url: z.string(),
			title: z.string().optional(),
			weight: z.enum(['100', '200', '300', '400', '500', '600', '700', '800']),
			isItalic: z.boolean().default(false).optional(),
			isMain: z.boolean().default(false).optional(),
		})),
		pubDate: z
			.string()
			.or(z.date())
			.transform((val) => new Date(val)),
	}),
});

const licenses = defineCollection({
	schema: z.object({
		title: z.string(),
		font: z.object({
			name: z.string(),
			href: z.string(),
		}),
		prices: z.array(z.object({
			title: z.string(),
			price: z.string(),
			href: z.string(),
			btnText: z.string(),
			active: z.boolean().optional(),
			list: z.array(z.string()),
		})).optional()
	}),
});

const typography = defineCollection({
	type: 'data',
	schema: z.object({
		title: z.string(),
		words: z.array(z.object({
			title: z.string(),
			description: z.string(),
		}))
	})
})

export const collections = { blog, qaripter, licenses, typography };
