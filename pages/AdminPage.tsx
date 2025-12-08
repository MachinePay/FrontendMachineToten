// Página: /pages/AdminPage.tsx
// Esta página fornece uma interface administrativa simples para listar,
// adicionar, editar e remover produtos do "cardápio".
// Comentários em português explicam cada parte do código.

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Product } from "../types";
import { authenticatedFetch } from "../services/apiService";
import { useAuth } from "../contexts/AuthContext";
import { getCurrentStoreId } from "../utils/tenantResolver";

// --- Componente de formulário de produto (Modal) ---
// Props esperadas pelo formulário:
interface ProductFormProps {
  product: Product | null; // produto que será editado (null para novo)
  onSave: (product: Product) => void; // callback ao salvar
  onCancel: () => void; // callback ao cancelar/fechar
}

const ProductForm: React.FC<ProductFormProps> = ({
  product,
  onSave,
  onCancel,
}) => {
  // Estado local do formulário. Usamos Omit para não incluir 'id' e 'imageUrl'
  // no tipo inicial, mas permitimos opcionalmente 'id' enquanto editamos.
  const [formData, setFormData] = useState<
    Omit<Product, "id" | "imageUrl"> & { id?: string }
  >({
    name: "",
    description: "",
    price: 0,
    category: "Pastel",
    videoUrl: "",
    stock: 0,
  });

  // 🆕 Estado para categorias dinâmicas
  const [categories, setCategories] = useState<Array<{ name: string }>>([]);

  // 🆕 Carrega categorias ao montar componente
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { getCategories } = await import("../services/categoryService");
        const data = await getCategories();
        if (data.length > 0) {
          setCategories(data);
        } else {
          // Fallback caso não haja categorias
          setCategories([
            { name: "Pastel" },
            { name: "Bebida" },
            { name: "Doce" },
          ]);
        }
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
        // Fallback em caso de erro
        setCategories([
          { name: "Pastel" },
          { name: "Bebida" },
          { name: "Doce" },
        ]);
      }
    };
    loadCategories();
  }, []);

  // Quando o prop `product` muda (por ex. abrir para editar), preenche o formulário.
  useEffect(() => {
    if (product) {
      setFormData(product); // preenche com dados existentes
    } else {
      // limpa para novo produto
      setFormData({
        name: "",
        description: "",
        price: 0,
        category: categories.length > 0 ? categories[0].name : "Pastel",
        videoUrl: "",
        stock: 0,
      });
    }
  }, [product, categories]);

  // Atualiza campos do formulário. Convertendo price para número quando necessário.
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    // Se for o campo 'price' ou 'stock', converte para número; caso contrário mantém string.
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "price"
          ? parseFloat(value)
          : name === "stock"
          ? parseInt(value)
          : value,
    }));
  };

  // Ao submeter, cria um objeto Product final e chama onSave.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalProduct: Product = {
      ...formData,
      // Se já houver id (edição) usa-o, senão o backend gerará um novo
      id: formData.id || "",
      // Placeholder para imagem (backend pode adicionar lógica de upload futuramente)
      imageUrl: formData.id
        ? product?.imageUrl || "https://picsum.photos/400/300"
        : "https://picsum.photos/400/300",
      // videoUrl padrão se não fornecido
      videoUrl:
        formData.videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4",
    };
    onSave(finalProduct); // informa o componente pai sobre o produto salvo
  };

  return (
    // Modal em tela cheia com fundo escuro semitransparente
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Título muda conforme edição ou criação */}
        <h2 className="text-2xl font-bold mb-6 text-amber-800">
          {product ? "Editar Produto" : "Adicionar Produto"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-stone-700"
            >
              Nome
            </label>
            {/* Campo nome */}
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
            />
          </div>
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-stone-700"
            >
              Descrição
            </label>
            {/* Campo descrição (textarea) */}
            <textarea
              name="description"
              id="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label
                htmlFor="price"
                className="block text-sm font-medium text-stone-700"
              >
                Preço
              </label>
              {/* Campo preço (numérico). step=0.01 para decimais */}
              <input
                type="number"
                name="price"
                id="price"
                value={formData.price}
                onChange={handleChange}
                required
                step="0.01"
                className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="category"
                className="block text-sm font-medium text-stone-700"
              >
                Categoria
              </label>
              {/* Select de categoria - 🆕 dinâmico */}
              <select
                name="category"
                id="category"
                value={formData.category}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
              >
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option>Pastel</option>
                    <option>Bebida</option>
                    <option>Doce</option>
                  </>
                )}
              </select>
            </div>
          </div>
          <div>
            <label
              htmlFor="videoUrl"
              className="block text-sm font-medium text-stone-700"
            >
              URL do Vídeo
            </label>
            {/* Campo URL do vídeo */}
            <input
              type="url"
              name="videoUrl"
              id="videoUrl"
              value={formData.videoUrl || ""}
              onChange={handleChange}
              placeholder="https://exemplo.com/video.mp4"
              className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
            />
            <p className="mt-1 text-xs text-stone-500">
              URL do vídeo do produto (opcional)
            </p>
          </div>
          <div>
            <label
              htmlFor="stock"
              className="block text-sm font-medium text-stone-700"
            >
              Estoque
            </label>
            {/* Campo estoque (numérico) */}
            <input
              type="number"
              name="stock"
              id="stock"
              value={formData.stock || 0}
              onChange={handleChange}
              required
              min="0"
              className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
            />
            <p className="mt-1 text-xs text-stone-500">
              Quantidade disponível em estoque
            </p>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            {/* Botão cancelar fecha o modal sem salvar */}
            <button
              type="button"
              onClick={onCancel}
              className="bg-stone-200 text-stone-800 font-semibold py-2 px-4 rounded-lg hover:bg-stone-300"
            >
              Cancelar
            </button>
            {/* Botão salvar submete o formulário */}
            <button
              type="submit"
              className="bg-amber-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-amber-700"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Componente principal da página administrativa ---
const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Estado que contém a lista de produtos exibida na tabela
  const [menu, setMenu] = useState<Product[]>([]);
  // Controla se o modal de formulário está aberto
  const [isFormOpen, setIsFormOpen] = useState(false);
  // Produto atual sendo editado (ou null para criar novo)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  // Estados para análise de IA
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  // Estados para estatísticas
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    lowStock: 0,
    outOfStock: 0,
  });

  // Carrega os dados iniciais do backend
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const storeId = getCurrentStoreId();

      const res = await fetch(`${API_URL}/api/menu`, {
        headers: {
          "Content-Type": "application/json",
          "x-store-id": storeId, // 🏪 MULTI-TENANT
        },
      });

      if (!res.ok) {
        throw new Error(`Erro ao carregar produtos: ${res.status}`);
      }

      const data = await res.json();
      setMenu(data);

      // Calcula estatísticas
      setStats({
        totalProducts: data.length,
        totalOrders: 0, // Será atualizado pela análise de IA
        lowStock: data.filter(
          (p: Product) => p.stock !== null && p.stock > 0 && p.stock <= 5
        ).length,
        outOfStock: data.filter((p: Product) => p.stock === 0).length,
      });
    } catch (err) {
      console.error("Erro ao carregar cardápio:", err);
    }
  };

  // Gerar análise de IA
  const handleGenerateAnalysis = async () => {
    setIsLoadingAnalysis(true);
    setShowAnalysis(true);
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

    try {
      const storeId = getCurrentStoreId();
      const response = await fetch(`${API_URL}/api/ai/inventory-analysis`, {
        headers: { "x-store-id": storeId }, // 🏪 MULTI-TENANT
      });
      const data = await response.json();

      if (data.success) {
        setAiAnalysis(data.analysis);
        // Atualiza estatísticas com dados do backend
        if (data.summary) {
          setStats((prev) => ({
            ...prev,
            totalOrders: data.summary.totalOrders || 0,
          }));
        }
      } else {
        setAiAnalysis(
          "❌ Erro ao gerar análise: " + (data.error || "Erro desconhecido")
        );
      }
    } catch (error) {
      console.error("Erro ao gerar análise:", error);
      setAiAnalysis(
        "❌ Erro ao comunicar com o servidor. Verifique se a API está disponível."
      );
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  // Trata salvar (tanto criação quanto edição)
  const handleSaveProduct = async (product: Product) => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

    try {
      if (editingProduct) {
        // PUT para edição
        const response = await authenticatedFetch(
          `${API_URL}/api/products/${product.id}`,
          {
            method: "PUT",
            body: JSON.stringify(product),
          }
        );

        if (response.ok) {
          console.log("Produto atualizado");
          await loadProducts(); // Recarrega lista
        } else {
          alert("Erro ao atualizar produto");
          return;
        }
      } else {
        // POST para criação
        const response = await authenticatedFetch(`${API_URL}/api/products`, {
          method: "POST",
          body: JSON.stringify(product),
        });

        if (response.ok) {
          console.log("Produto criado");
          await loadProducts(); // Recarrega lista
        } else {
          alert("Erro ao criar produto");
          return;
        }
      }

      // Fecha o modal e reseta o estado de edição
      setIsFormOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      alert("Erro ao salvar produto");
    }
  };

  // Remove um produto pela id via API
  const handleDeleteProduct = async (productId: string) => {
    // Confirmação simples antes de remover
    if (window.confirm("Tem certeza que deseja remover este produto?")) {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

      try {
        const response = await authenticatedFetch(
          `${API_URL}/api/products/${productId}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          console.log("Produto deletado:", productId);
          await loadProducts(); // Recarrega lista
        } else {
          alert("Erro ao deletar produto");
        }
      } catch (error) {
        console.error("Erro ao deletar produto:", error);
        alert("Erro ao deletar produto");
      }
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-amber-800">
          Painel Administrativo
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/admin/categories")}
            className="bg-purple-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-purple-700 transition-colors shadow-md"
          >
            📂 Categorias
          </button>
          <button
            onClick={handleGenerateAnalysis}
            disabled={isLoadingAnalysis}
            className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 transition-colors shadow-md disabled:bg-indigo-300 flex items-center gap-2"
          >
            {isLoadingAnalysis ? "⏳ Analisando..." : "🤖 Análise com IA"}
          </button>
          <button
            onClick={() => {
              setEditingProduct(null);
              setIsFormOpen(true);
            }}
            className="bg-amber-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-amber-600 transition-colors shadow-md"
          >
            + Adicionar Produto
          </button>
          <button
            onClick={async () => {
              if (window.confirm("Deseja realmente sair?")) {
                await logout();
                navigate("/admin/login");
              }
            }}
            className="bg-red-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-600 transition-colors shadow-md"
          >
            🚪 Sair
          </button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
          <div className="text-sm text-stone-500 mb-1">Total de Produtos</div>
          <div className="text-3xl font-bold text-blue-600">
            {stats.totalProducts}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500">
          <div className="text-sm text-stone-500 mb-1">Pedidos (30 dias)</div>
          <div className="text-3xl font-bold text-green-600">
            {stats.totalOrders}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-yellow-500">
          <div className="text-sm text-stone-500 mb-1">Estoque Baixo</div>
          <div className="text-3xl font-bold text-yellow-600">
            {stats.lowStock}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-red-500">
          <div className="text-sm text-stone-500 mb-1">Esgotados</div>
          <div className="text-3xl font-bold text-red-600">
            {stats.outOfStock}
          </div>
        </div>
      </div>

      {/* Área de Análise da IA */}
      {showAnalysis && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl shadow-lg mb-6 border border-purple-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-purple-800 flex items-center gap-2">
              🤖 Análise Inteligente de Estoque
            </h2>
            <button
              onClick={() => setShowAnalysis(false)}
              className="text-stone-500 hover:text-stone-700"
            >
              ✕
            </button>
          </div>
          {isLoadingAnalysis ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-stone-700 leading-relaxed">
                {aiAnalysis}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Renderiza o formulário/modal condicionalmente */}
      {isFormOpen && (
        <ProductForm
          product={editingProduct}
          onSave={handleSaveProduct}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingProduct(null);
          }}
        />
      )}

      {/* Seção de Gerenciamento de Produtos */}
      <h2 className="text-2xl font-bold text-stone-800 mb-4">
        📦 Gerenciar Produtos
      </h2>

      {/* Tabela que lista os produtos */}
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
        <table className="min-w-full divide-y divide-stone-200">
          <thead className="bg-stone-50">
            <tr>
              {/* Cabeçalhos de coluna */}
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider"
              >
                Produto
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider"
              >
                Categoria
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider"
              >
                Preço
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider"
              >
                Estoque
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-stone-200">
            {/* Itera sobre o array de produtos para gerar as linhas */}
            {menu.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {/* Miniatura da imagem do produto */}
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={product.imageUrl}
                        alt={product.name}
                      />
                    </div>
                    <div className="ml-4">
                      {/* Nome e descrição */}
                      <div className="text-sm font-medium text-stone-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-stone-500 truncate max-w-xs">
                        {product.description}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {/* Categoria com estilo de badge */}
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {product.category}
                  </span>
                </td>
                {/* Preço formatado com duas casas decimais */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                  R${product.price.toFixed(2)}
                </td>
                {/* Estoque com badge colorido */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      (product.stock || 0) === 0
                        ? "bg-red-100 text-red-800"
                        : (product.stock || 0) < 10
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {product.stock || 0} un.
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {/* Botões de ação: editar abre o modal preenchido */}
                  <button
                    onClick={() => {
                      setEditingProduct(product);
                      setIsFormOpen(true);
                    }}
                    className="text-amber-600 hover:text-amber-900 mr-4"
                  >
                    Editar
                  </button>
                  {/* Remover chama a função de deletar */}
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPage;
