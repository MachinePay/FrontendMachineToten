// Componente de formulário para criar/editar categorias
import React, { useState, useEffect } from "react";
import type { Category } from "../services/categoryService";

interface CategoryFormProps {
  category: Category | null; // null = criar nova categoria
  onSave: (categoryData: { name: string; icon: string; order: number }) => void;
  onCancel: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    icon: "📦",
    order: 0,
  });

  // Preenche o formulário quando editar categoria existente
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        icon: category.icon,
        order: category.order,
      });
    } else {
      setFormData({
        name: "",
        icon: "📦",
        order: 0,
      });
    }
  }, [category]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "order" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Nome da categoria é obrigatório");
      return;
    }
    onSave(formData);
  };

  // Lista de ícones comuns para categorias de comida
  const commonIcons = [
    "📦",
    "🍕",
    "🍔",
    "🌮",
    "🍜",
    "🍱",
    "🍰",
    "🥤",
    "☕",
    "🍺",
    "🥗",
    "🍝",
    "🍣",
    "🥘",
    "🍛",
    "🥙",
    "🌯",
    "🧁",
    "🍩",
    "🍪",
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-purple-800">
          {category ? "Editar Categoria" : "Nova Categoria"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome da Categoria */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              Nome da Categoria *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Pastel de queijo, pastel de carne, pastel doce..."
              className="w-full px-4 py-2 border-2 border-stone-200 rounded-lg focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          {/* Ícone */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              Ícone (Emoji)
            </label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {commonIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, icon }))}
                  className={`text-2xl p-2 rounded-lg border-2 transition-all ${
                    formData.icon === icon
                      ? "border-purple-500 bg-purple-50 scale-110"
                      : "border-stone-200 hover:border-purple-300"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
            <input
              type="text"
              name="icon"
              value={formData.icon}
              onChange={handleChange}
              placeholder="Ou digite um emoji personalizado"
              className="w-full px-4 py-2 border-2 border-stone-200 rounded-lg focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Ordem */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              Ordem de Exibição
            </label>
            <input
              type="number"
              name="order"
              value={formData.order}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border-2 border-stone-200 rounded-lg focus:outline-none focus:border-purple-500"
            />
            <p className="text-xs text-stone-500 mt-1">
              Menor número = aparece primeiro
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 bg-stone-200 text-stone-700 rounded-lg font-semibold hover:bg-stone-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              {category ? "Atualizar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryForm;
