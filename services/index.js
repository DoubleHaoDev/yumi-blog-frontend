import apiClient from '../lib/api';

export const getPosts = async () => {
  return apiClient.get('/posts');
};

export const getFeaturedPosts = async () => {
  return apiClient.get('/posts?featured=true');
};

export const getRecentPosts = async () => {
  return apiClient.get('/posts/recent');
};

export const getPostDetails = async (slug) => {
  return apiClient.get(`/posts/${slug}`);
};

export const getSimilarPosts = async (categories, slug) => {
  return apiClient.get(`/posts/${slug}/similar`);
};

export const getAdjacentPosts = async (createdAt, slug) => {
  return apiClient.get(`/posts/${slug}/adjacent`);
};

export const getCategories = async () => {
  return apiClient.get('/categories');
};

export const getCategoryPost = async (slug) => {
  return apiClient.get(`/categories/${slug}/posts`);
};

export const getComments = async (slug) => {
  return apiClient.get(`/posts/${slug}/comments`);
};

export const submitComment = async (obj) => {
  return apiClient.post('/comments', {
    name: obj.name,
    email: obj.email,
    content: obj.comment,
    slug: obj.slug,
  });
};
