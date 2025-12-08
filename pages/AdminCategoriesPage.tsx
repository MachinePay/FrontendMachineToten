// Página de gerenciamento de categorias (Admin)
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from "../services/categoryService";
import CategoryForm from "../components/CategoryForm";
import { getCurrentStoreId } from "../utils/tenantResolver";

const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const navigate = useNavigate();
  const storeId = getCurrentStoreId();

  // Carrega categorias ao montar o componente
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
      Swal.fire("Erro", "Não foi possível carregar as categorias", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async (categoryData: {
    name: string;
    icon: string;
    order: number;
  }) => {
    try {
      await createCategory(categoryData);
      await Swal.fire("Sucesso!", "Categoria criada com sucesso", "success");
      setShowForm(false);
      loadCategories();
    } catch (error: any) {
      console.error("Erro ao criar categoria:", error);
      Swal.fire("Erro", error.message || "Erro ao criar categoria", "error");
    }
  };

  const handleUpdateCategory = async (categoryData: {
    name: string;
    icon: string;
    order: number;
  }) => {
    if (!editingCategory) return;

    try {
      await updateCategory(editingCategory.id, categoryData);
      await Swal.fire(
        "Sucesso!",
        "Categoria atualizada com sucesso",
        "success"
      );
      setShowForm(false);
      setEditingCategory(null);
      loadCategories();
    } catch (error: any) {
      console.error("Erro ao atualizar categoria:", error);
      Swal.fire(
        "Erro",
        error.message || "Erro ao atualizar categoria",
        "error"
      );
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    const result = await Swal.fire({
      title: "Confirmar exclusão?",
      html: `Deseja realmente deletar a categoria <strong>${category.name}</strong>?<br><br><small>⚠️ Não será possível deletar se houver produtos usando esta categoria</small>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sim, deletar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await deleteCategory(category.id);
        await Swal.fire(
          "Deletado!",
          "Categoria removida com sucesso",
          "success"
        );
        loadCategories();
      } catch (error: any) {
        console.error("Erro ao deletar categoria:", error);
        Swal.fire(
          "Erro",
          error.message || "Erro ao deletar categoria",
          "error"
        );
      }
    }
  };

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-purple-100 to-indigo-200">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🔄</div>
          <p className="text-xl text-purple-800 font-semibold">
            Carregando categorias...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-200 p-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/admin")}
                className="text-purple-600 hover:bg-purple-100 p-2 rounded-full transition-colors"
              >
                ← Voltar
              </button>
              <div>
                <h1 className="text-3xl font-bold text-purple-800">
                  📂 Gerenciar Categorias
                </h1>
                <p className="text-stone-600 text-sm mt-1">
                  Organize os produtos em categorias
                </p>
                <div className="mt-2 inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold">
                  🏪 Loja: {storeId}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingCategory(null);
                setShowForm(true);
              }}
              className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-all shadow-lg hover:scale-105"
            >
              ➕ Nova Categoria
            </button>
          </div>
        </div>

        {/* Lista de Categorias */}
        {categories.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-stone-800 mb-2">
              Nenhuma categoria cadastrada
            </h2>
            <p className="text-stone-600 mb-6">
              Crie a primeira categoria para organizar seus produtos
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
            >
              Criar Primeira Categoria
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{category.icon}</span>
                    <div>
                      <h3 className="text-xl font-bold text-stone-800">
                        {category.name}
                      </h3>
                      <p className="text-sm text-stone-500">
                        Ordem: {category.order}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleEditClick(category)}
                    className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category)}
                    className="flex-1 bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors"
                  >
                    🗑️ Deletar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Estatísticas */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
          <h2 className="text-xl font-bold text-stone-800 mb-4">
            📊 Estatísticas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
              <p className="text-purple-600 text-sm font-semibold">
                Total de Categorias
              </p>
              <p className="text-3xl font-bold text-purple-800">
                {categories.length}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
              <p className="text-blue-600 text-sm font-semibold">
                Primeira Ordem
              </p>
              <p className="text-3xl font-bold text-blue-800">
                {categories.length > 0
                  ? Math.min(...categories.map((c) => c.order))
                  : "-"}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
              <p className="text-green-600 text-sm font-semibold">
                Última Ordem
              </p>
              <p className="text-3xl font-bold text-green-800">
                {categories.length > 0
                  ? Math.max(...categories.map((c) => c.order))
                  : "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Formulário */}
      {showForm && (
        <CategoryForm
          category={editingCategory}
          onSave={editingCategory ? handleUpdateCategory : handleCreateCategory}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
};

export default AdminCategoriesPage;
