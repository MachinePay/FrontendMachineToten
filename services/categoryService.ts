// Serviço de API para Categorias com Multi-tenant
import { authenticatedFetch, publicFetch } from "./apiService";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const API_URL = `${BASE_URL}/api`;

export interface Category {
  id: string;
  name: string;
  icon: string;
  order: number;
  store_id: string;
}

/**
 * Busca todas as categorias da loja atual (público)
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const response = await publicFetch(`${API_URL}/categories`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `❌ Erro ao buscar categorias (${response.status}):`,
        errorText
      );
      throw new Error(`Backend error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.error("❌ Backend retornou dados inválidos (não é array):", data);
      return [];
    }

    return data;
  } catch (error) {
    console.error("❌ Erro ao buscar categorias:", error);
    return [];
  }
}

/**
 * Cria uma nova categoria (autenticado - admin)
 */
export async function createCategory(categoryData: {
  name: string;
  icon?: string;
  order?: number;
}): Promise<Category> {
  const response = await authenticatedFetch(`${API_URL}/categories`, {
    method: "POST",
    body: JSON.stringify(categoryData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erro ao criar categoria");
  }

  return response.json();
}

/**
 * Atualiza uma categoria existente (autenticado - admin)
 */
export async function updateCategory(
  categoryId: string,
  categoryData: {
    name?: string;
    icon?: string;
    order?: number;
  }
): Promise<Category> {
  const response = await authenticatedFetch(
    `${API_URL}/categories/${categoryId}`,
    {
      method: "PUT",
      body: JSON.stringify(categoryData),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erro ao atualizar categoria");
  }

  return response.json();
}

/**
 * Deleta uma categoria (autenticado - admin)
 */
export async function deleteCategory(categoryId: string): Promise<void> {
  const response = await authenticatedFetch(
    `${API_URL}/categories/${categoryId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erro ao deletar categoria");
  }
}
