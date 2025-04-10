import Post from '../models/post.model.js';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY,
});


const summary = async (content) => {
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Summarize the following content: ${content}`
    });
    return response.text;
};

const postResolvers = {
    Query: {
        posts: async () => await Post.find(),
        post: async (_, { id }) => await Post.findById(id),
    },
    Mutation: {
        createPost: async (_, { title, content, category }, { user }) => {
            if (!user) throw new Error('You must be logged in to create a post');

            const post = new Post({
                title,
                content,
                category,
                author: user.id,
                aiSummary: await summary(content),
            });

            // AI summary logic can be added here if needed

            await post.save();
            return post;
        },

        updatePost: async (_, { id, title, content, category }, { user }) => {
            if (!user) throw new Error('You must be logged in to update a post');

            const post = await Post.findById(id);
            if (!post) throw new Error('Post not found');

            // Check if user is the author
            if (post.author.toString() !== user.id) {
                throw new Error('Not authorized to edit this post');
            }

            const updates = {};
            if (title) updates.title = title;
            if (content) updates.content = content;
            if (category) updates.category = category;
            if (content) updates.aiSummary = await summary(content);
            updates.updatedAt = new Date();

            // AI summary could be updated here if needed

            const updatedPost = await Post.findByIdAndUpdate(
                id,
                { $set: updates },
                { new: true }
            );

            return updatedPost;
        },

        deletePost: async (_, { id }, { user }) => {
            if (!user) throw new Error('You must be logged in to delete a post');

            const post = await Post.findById(id);
            if (!post) throw new Error('Post not found');

            // Check if user is the author or an admin
            if (post.author.toString() !== user.id && user.role !== 'admin') {
                throw new Error('Not authorized to delete this post');
            }

            await Post.findByIdAndDelete(id);
            return true;
        }
    },
    Post: {
        author(post) {
            const authorRef = { __typename: 'User', id: post.author };
            console.log(`[Community Service] Returning author reference:`, JSON.stringify(authorRef));
            return authorRef;
        }
    }
};

export default postResolvers;
