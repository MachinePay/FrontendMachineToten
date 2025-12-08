import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import {
  getMenuSuggestion,
  getDynamicCartSuggestion,
  getChefMessage,
} from "../services/geminiService";
import { getProducts } from "../services/apiService"; // 🏪 MULTI-TENANT
import type { Product, CartItem } from "../types";

// URL da API
const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ==========================================
// 1. COMPONENTE: PRODUCT CARD (Produtos maiores)
// ==========================================
interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  quantityInCart?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  quantityInCart = 0,
}) => {
  // Lógica ajustada: Se for null é ilimitado. Se for 0 é esgotado.
  const isOutOfStock = product.stock === 0;

  return (
    <div
      className={`bg-white rounded-2xl shadow-md overflow-hidden flex flex-col relative h-full transition-transform hover:shadow-xl ${
        isOutOfStock ? "opacity-60 grayscale" : ""
      }`}
    >
      {/* Badges - Apenas ESGOTADO agora */}
      {isOutOfStock && (
        <div className="absolute top-3 right-3 z-10 bg-red-600 text-white font-bold px-3 py-1 rounded text-sm shadow-sm">
          ESGOTADO
        </div>
      )}

      {/* Mídia (Vídeo/Imagem) */}
      <div className="relative h-40 md:h-52 bg-gray-100">
        <video
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={product.videoUrl} type="video/mp4" />
        </video>
      </div>

      {/* Conteúdo */}
      <div className="p-4 flex flex-col flex-grow justify-between">
        <div>
          <h3 className="font-bold text-lg md:text-xl text-gray-800 leading-tight mb-2">
            {product.name}
          </h3>
          <p className="hidden md:block text-sm text-stone-600 line-clamp-2 mb-3">
            {product.description}
          </p>
        </div>

        <div className="mt-2">
          <div className="flex flex-col gap-3">
            <span className="text-xl md:text-2xl font-bold text-stone-800">
              R$ {product.price.toFixed(2)}
            </span>
            <button
              onClick={() => onAddToCart(product)}
              disabled={isOutOfStock}
              className={`w-full font-bold py-3 px-4 rounded-xl text-base md:text-lg transition-colors shadow-sm ${
                isOutOfStock
                  ? "bg-stone-300 text-stone-500 cursor-not-allowed"
                  : "bg-red-600 text-white hover:bg-red-700 active:bg-red-800"
              }`}
            >
              {quantityInCart > 0
                ? `Adicionado (${quantityInCart})`
                : "Adicionar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. COMPONENTE: CART SIDEBAR (Letras e Botões Grandes + Observação)
// ==========================================
interface CartSidebarProps {
  cartItems: CartItem[];
  cartTotal: number;
  updateQuantity: (id: string, q: number) => void;
  onCheckout: () => void;
  isPlacingOrder: boolean;
  cartSuggestion?: string;
  isMobile?: boolean;
  onClose?: () => void;
  menu: Product[];
  onAddToCart: (product: Product) => void;
  observation: string; // <--- Recebe a observação
  setObservation: (obs: string) => void; // <--- Recebe a função para alterar
}

const CartSidebar: React.FC<CartSidebarProps> = ({
  cartItems,
  cartTotal,
  updateQuantity,
  onCheckout,
  isPlacingOrder,
  cartSuggestion,
  isMobile = false,
  onClose,
  menu,
  onAddToCart,
  observation,
  setObservation,
}) => {
  const [showObservationSaved, setShowObservationSaved] = useState(false);
  const observationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const containerClass = isMobile
    ? "fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-[0_-10px_60px_rgba(0,0,0,0.4)] flex flex-col max-h-[90vh] transition-transform duration-300 ease-out transform translate-y-0 border-t border-stone-200"
    : "flex flex-col h-full bg-white border-l border-stone-200";

  // Lógica para encontrar o produto sugerido
  const suggestedProduct = useMemo(() => {
    if (!cartSuggestion || !menu) return null;
    return menu.find(
      (p) =>
        cartSuggestion.toLowerCase().includes(p.name.toLowerCase()) ||
        (p.name.toLowerCase().includes("coca") &&
          cartSuggestion.toLowerCase().includes("coca"))
    );
  }, [cartSuggestion, menu]);

  const handleObservationChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setObservation(e.target.value);
    setShowObservationSaved(true);

    if (observationTimeoutRef.current) {
      clearTimeout(observationTimeoutRef.current);
    }

    observationTimeoutRef.current = setTimeout(() => {
      setShowObservationSaved(false);
    }, 2000); // Oculta a mensagem após 2 segundos
  };
  return (
    <div className={containerClass}>
      {/* Header do Carrinho */}
      <div
        className={`p-5 flex items-center justify-between ${
          isMobile
            ? "bg-stone-900 text-white rounded-t-3xl"
            : "bg-white border-b border-stone-100"
        }`}
      >
        <h2
          className={`text-2xl md:text-3xl font-bold flex items-center gap-3 ${
            isMobile ? "text-white" : "text-gray-800"
          }`}
        >
          <span>🛒</span> Minha Cesta (
          {cartItems.reduce((acc, i) => acc + i.quantity, 0)})
        </h2>
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white bg-stone-800 p-2 rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* Lista de Itens com Scroll */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-stone-50 min-h-0">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-stone-400">
            <span className="text-6xl mb-4">🛍️</span>
            <p className="text-xl">Seu carrinho está vazio.</p>
          </div>
        ) : (
          <>
            {/* SUGESTÃO DE UPSELL (GRANDE E VISÍVEL) */}
            {cartSuggestion && (
              <div className="p-5 bg-gradient-to-r from-red-50 to-red-100 border-l-8 border-red-600 rounded-xl shadow-md mb-6">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">✨</span>
                    <div>
                      <p className="text-sm font-bold text-red-800 uppercase tracking-wide mb-1">
                        Dica do Chef
                      </p>
                      <p className="text-lg md:text-xl text-gray-900 font-medium leading-snug">
                        {cartSuggestion}
                      </p>
                    </div>
                  </div>

                  {suggestedProduct && (
                    <div className="mt-2 ml-2 flex items-center gap-4 bg-white/60 p-3 rounded-xl border border-red-200/50 shadow-sm">
                      <div className="hidden xs:block w-16 h-16 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                        <video
                          src={suggestedProduct.videoUrl}
                          className="w-full h-full object-cover"
                          muted
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-bold text-gray-900 truncate">
                          {suggestedProduct.name}
                        </p>
                        <p className="text-base font-bold text-red-700">
                          R$ {suggestedProduct.price.toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => onAddToCart(suggestedProduct)}
                        className="bg-red-600 text-white text-base font-bold px-5 py-3 rounded-xl shadow-md hover:bg-red-700 transition-colors whitespace-nowrap"
                      >
                        + Adicionar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ITENS DO CARRINHO (BOTÕES GRANDES) */}
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex bg-white p-4 rounded-xl shadow-sm border border-stone-200 items-center justify-between"
              >
                <div className="flex-1 pr-4">
                  <p className="font-bold text-stone-800 text-lg md:text-xl leading-tight mb-1">
                    {item.name}
                  </p>
                  <p className="text-base font-semibold text-stone-500">
                    R$ {item.price.toFixed(2)}
                  </p>
                </div>

                {/* CONTROLES DE QUANTIDADE GRANDES */}
                <div className="flex items-center bg-stone-100 rounded-xl border border-stone-300 overflow-hidden h-12 md:h-14 shadow-inner">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-12 md:w-14 h-full flex items-center justify-center text-stone-600 font-bold text-2xl hover:bg-red-100 hover:text-red-600 transition-colors active:bg-red-200"
                  >
                    -
                  </button>
                  <span className="w-10 md:w-12 h-full flex items-center justify-center text-xl font-bold bg-white border-x border-stone-200">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-12 md:w-14 h-full flex items-center justify-center bg-red-600 text-white font-bold text-2xl hover:bg-red-700 transition-colors active:bg-red-800"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer / Checkout */}
      {cartItems.length > 0 && (
        <div className="p-6 bg-white border-t border-stone-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          {/* CAMPO DE OBSERVAÇÃO - AGORA CONECTADO AO CONTEXTO */}
          <div className="mb-4">
            <label
              htmlFor="observation"
              className="block text-lg font-bold text-stone-700 mb-2"
            >
              📝 Alguma observação?
            </label>
            <textarea
              id="observation"
              value={observation}
              onChange={handleObservationChange}
              placeholder="Ex: Sem wasabi, molho à parte, hashi incluso..."
              className="w-full p-3 border-2 border-stone-300 rounded-xl focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-200 transition-all text-lg"
              rows={2}
            />
            {showObservationSaved && observation && (
              <p className="text-xs text-green-600 font-bold mt-1 animate-pulse">
                ✓ Observação salva!
              </p>
            )}
          </div>

          <div className="flex justify-between items-center mb-4">
            <span className="text-stone-500 font-bold text-xl">Total</span>
            <span className="text-3xl md:text-4xl font-bold text-stone-800">
              R$ {cartTotal.toFixed(2)}
            </span>
          </div>
          <button
            onClick={onCheckout}
            disabled={isPlacingOrder}
            className="w-full bg-green-600 text-white font-bold py-4 md:py-5 text-xl md:text-2xl rounded-2xl hover:bg-green-700 transition-colors disabled:bg-stone-300 shadow-lg active:scale-[0.98] flex justify-center items-center gap-3"
          >
            {isPlacingOrder ? (
              "Processando..."
            ) : (
              <>
                <span>Finalizar Compra</span>
                <span className="text-3xl">➜</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. COMPONENTE: CATEGORY SIDEBAR
// ==========================================
interface CategorySidebarProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  dynamicCategories?: Array<{ name: string; icon: string; order: number }>; // 🆕
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  dynamicCategories = [], // 🆕
}) => {
  // 🆕 Helper para pegar ícone dinâmico ou fallback
  const getCategoryIcon = (categoryName: string): string => {
    const dynamicCat = dynamicCategories.find((dc) => dc.name === categoryName);
    if (dynamicCat) return dynamicCat.icon;

    // Fallback para ícones automáticos baseados em nome - Tema Japonês
    const lowerCat = categoryName.toLowerCase();
    if (lowerCat.includes("sushi") || lowerCat.includes("niguiri")) return "🍣";
    if (lowerCat.includes("sashimi")) return "🐟";
    if (lowerCat.includes("hot") || lowerCat.includes("roll")) return "🍱";
    if (lowerCat.includes("temaki")) return "🌯";
    if (lowerCat.includes("bebida")) return "🥤";
    if (lowerCat.includes("doce") || lowerCat.includes("sobremesa"))
      return "🍰";
    if (lowerCat.includes("combo")) return "🍱";
    if (lowerCat.includes("entrada") || lowerCat.includes("appetizer"))
      return "🥟";
    return "🍽️";
  };

  return (
    <aside className="w-[100px] md:w-72 bg-white z-40 flex flex-col h-full border-r border-stone-200 shadow-xl overflow-hidden shrink-0">
      {/* Logo Area */}
      <div className="h-20 md:h-28 flex items-center justify-center border-b border-stone-100 bg-red-600">
        <span className="md:hidden text-4xl">🍣</span>
        <h1 className="hidden md:block text-3xl font-extrabold text-white tracking-wide">
          MENU
        </h1>
      </div>

      {/* Menu Items Container */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide gap-4 pb-20">
        <button
          onClick={() => onSelectCategory(null)}
          className={`w-full py-6 px-2 md:px-6 flex flex-col md:flex-row items-center md:justify-start gap-2 md:gap-6 transition-all duration-200 border-l-8 ${
            selectedCategory === null
              ? "bg-red-50 border-red-600 text-red-800"
              : "border-transparent bg-white text-stone-400 hover:bg-stone-50 hover:text-stone-600"
          }`}
        >
          <span
            className={`text-3xl md:text-4xl ${
              selectedCategory === null ? "scale-110" : "grayscale opacity-70"
            }`}
          >
            🔥
          </span>
          <span className="text-xs md:text-xl font-bold uppercase">Todos</span>
        </button>

        <div className="my-4 border-t border-stone-100 mx-4"></div>

        {categories.map((category) => {
          const isSelected = selectedCategory === category;
          const icon = getCategoryIcon(category); // 🆕 Usa ícone dinâmico

          return (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              className={`w-full py-6 px-2 md:px-6 flex flex-col md:flex-row items-center md:justify-start gap-2 md:gap-6 transition-all duration-200 border-l-8 ${
                isSelected
                  ? "bg-red-50 border-red-600 text-red-800"
                  : "border-transparent text-stone-400 hover:bg-stone-50 hover:text-stone-600 bg-white"
              }`}
            >
              <span
                className={`text-3xl md:text-4xl transition-transform ${
                  isSelected ? "scale-110" : "grayscale opacity-70"
                }`}
              >
                {icon}
              </span>
              <span
                className={`text-xs md:text-xl font-bold text-center md:text-left leading-tight uppercase`}
              >
                {category}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

// ==========================================
// 4. COMPONENTE PRINCIPAL: PAGE LAYOUT
// ==========================================

const MenuPage: React.FC = () => {
  const [menu, setMenu] = useState<Product[]>([]);
  const [suggestion, setSuggestion] = useState<string>("");
  const [cartSuggestion, setCartSuggestion] = useState<string>("");
  const [chefMessage, setChefMessage] = useState<string>("");
  const [isChefLoading, setIsChefLoading] = useState<boolean>(false);
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // 🆕 Estado para categorias dinâmicas
  const [dynamicCategories, setDynamicCategories] = useState<
    Array<{ name: string; icon: string; order: number }>
  >([]);

  const { currentUser } = useAuth();

  // AQUI ESTÁ A MÁGICA: Extraímos observation e setObservation do contexto
  const {
    cartItems,
    addToCart,
    cartTotal,
    updateQuantity,
    clearCart,
    observation,
    setObservation,
  } = useCart();

  const navigate = useNavigate();

  const fetchMenuData = async () => {
    try {
      const data = await getProducts(); // 🏪 Usa apiService com x-store-id

      // ✅ Valida se é array antes de setar
      if (Array.isArray(data)) {
        setMenu(data);
        console.log(`✅ ${data.length} produtos carregados`);
      } else {
        console.error(
          "❌ Backend retornou dados inválidos (não é array):",
          data
        );
        setMenu([]);
      }
    } catch (error) {
      console.error("❌ Erro ao buscar menu:", error);
      setMenu([]); // ✅ Garante array vazio em caso de erro
    }
  };

  // 🆕 Busca categorias do backend
  const fetchCategories = async () => {
    try {
      console.log("🔄 Carregando categorias do backend...");
      const { getCategories } = await import("../services/categoryService");
      const data = await getCategories();
      console.log("📦 Categorias recebidas:", data);

      if (data.length > 0) {
        setDynamicCategories(data);
        console.log(
          `✅ ${data.length} categorias carregadas e setadas no estado`
        );
      } else {
        console.warn("⚠️ Nenhuma categoria encontrada no backend");
      }
    } catch (error) {
      console.error("❌ Erro ao buscar categorias:", error);
    }
  };

  useEffect(() => {
    fetchMenuData();
    fetchCategories(); // 🆕 Carrega categorias
  }, []);

  useEffect(() => {
    const fetchSuggestion = async () => {
      if (currentUser && menu.length > 0) {
        setIsSuggestionLoading(true);
        const newSuggestion = await getMenuSuggestion(
          currentUser.historico,
          cartItems,
          menu,
          currentUser.name
        );
        setSuggestion(newSuggestion);
        setIsSuggestionLoading(false);
      }
    };
    fetchSuggestion();
  }, [cartItems, currentUser, menu]);

  useEffect(() => {
    const fetchChefMessage = async () => {
      if (menu.length === 0) return;
      setIsChefLoading(true);
      try {
        const msg = await getChefMessage(
          currentUser ? currentUser.historico : [],
          currentUser?.name,
          menu
        );
        setChefMessage(msg);
      } catch (err) {
        setChefMessage("Bem-vindo!");
      } finally {
        setIsChefLoading(false);
      }
    };
    fetchChefMessage();
  }, [menu, currentUser]);

  useEffect(() => {
    const fetchCartSuggestion = async () => {
      if (menu.length > 0 && cartItems.length > 0) {
        const dynamicSuggestion = await getDynamicCartSuggestion(
          cartItems,
          menu,
          currentUser?.name
        );
        setCartSuggestion(dynamicSuggestion);
      } else {
        setCartSuggestion("");
      }
    };
    fetchCartSuggestion();
  }, [cartItems, menu, currentUser]);

  const handleCheckout = () => {
    if (!currentUser || cartItems.length === 0) return;
    navigate("/payment");
  };

  const categorizedMenu = useMemo(() => {
    // ✅ Proteção: garante que menu é array antes de usar .reduce
    if (!Array.isArray(menu) || menu.length === 0) {
      return {} as Record<string, Product[]>;
    }

    return menu.reduce((acc, product) => {
      const categoryKey = product.category as Product["category"];
      if (!acc[categoryKey]) acc[categoryKey] = [];
      acc[categoryKey].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [menu]);

  // 🆕 Usa categorias dinâmicas do backend (com ordem), ou fallback para categorias com produtos
  const displayCategories = useMemo(() => {
    if (dynamicCategories.length > 0) {
      // Ordena pelas categorias do backend (usando campo order)
      return dynamicCategories
        .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
        .map((cat) => cat.name);
    }
    // Fallback: usa categorias dos produtos existentes
    return Object.keys(categorizedMenu).sort();
  }, [dynamicCategories, categorizedMenu]);

  return (
    <div className="flex h-screen w-full bg-stone-100 overflow-hidden font-sans">
      {/* 1. SIDEBAR ESQUERDA */}
      <CategorySidebar
        categories={displayCategories} // 🆕 Usa categorias dinâmicas ordenadas
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        dynamicCategories={dynamicCategories}
      />

      {/* 2. ÁREA CENTRAL */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Header Mobile */}
        <header className="md:hidden bg-white/90 backdrop-blur-md p-4 sticky top-0 z-20 border-b border-stone-200 shadow-sm flex justify-between items-center">
          <h2 className="font-bold text-amber-800 text-xl">
            {selectedCategory || "Cardápio"}
          </h2>
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm border border-amber-200">
            {currentUser?.name?.charAt(0) || "C"}
          </div>
        </header>

        {/* Scroll Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-48 md:pb-8 scroll-smooth">
          {/* Mensagens IA */}
          <div className="max-w-6xl mx-auto space-y-6 mb-8">
            <div className="bg-white border-l-8 border-amber-400 p-5 rounded-r-xl shadow-sm">
              <h3 className="font-bold text-stone-800 text-base md:text-lg flex items-center gap-2">
                👨‍🍳 Chef
              </h3>
              <p className="text-stone-600 text-base md:text-lg mt-2 leading-relaxed">
                {isChefLoading ? "..." : chefMessage}
              </p>
            </div>

            {suggestion && !isSuggestionLoading && (
              <div className="bg-orange-50 border border-orange-200 p-5 rounded-xl shadow-sm">
                <h3 className="font-bold text-orange-800 text-base md:text-lg">
                  ✨ Sugestão Especial
                </h3>
                <p className="text-orange-900 text-lg md:text-xl mt-2 font-medium">
                  {suggestion}
                </p>
              </div>
            )}
          </div>

          {/* Grid de Produtos */}
          <div className="max-w-6xl mx-auto min-h-[101%]">
            {selectedCategory === null ? (
              Object.entries(categorizedMenu).map(([category, products]) => (
                <div
                  key={category}
                  className="mb-12 scroll-mt-24"
                  id={`cat-${category}`}
                >
                  <h3 className="text-2xl md:text-3xl font-bold text-stone-700 mb-6 flex items-center gap-3 border-b-2 border-stone-200 pb-3">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-8">
                    {(products as Product[]).map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={addToCart}
                        quantityInCart={
                          cartItems.find((i) => i.id === product.id)
                            ?.quantity || 0
                        }
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="animate-fadeIn">
                <h3 className="text-2xl md:text-3xl font-bold text-stone-700 mb-6 flex items-center gap-3">
                  {selectedCategory}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-8">
                  {categorizedMenu[selectedCategory]?.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={addToCart}
                      quantityInCart={
                        cartItems.find((i) => i.id === product.id)?.quantity ||
                        0
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. MOBILE BOTTOM CART (FIXO - BARRA) */}
        {cartItems.length > 0 && !isMobileCartOpen && (
          <div
            className="xl:hidden fixed bottom-0 right-0 z-50 flex flex-col shadow-[0_-4px_20px_rgba(0,0,0,0.2)]"
            style={{ width: "calc(100% - 100px)", height: "90px" }}
          >
            <div
              className="bg-stone-900 text-white px-10 py-10 flex justify-between items-center rounded-tl-2xl cursor-pointer active:bg-stone-800 transition-colors"
              onClick={() => setIsMobileCartOpen(true)}
            >
              <span className="text-lg font-bold uppercase tracking-wider flex items-center gap-3">
                <span className="text-2xl">🛒</span> Minha Cesta (
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)})
                <span className="text-sm bg-amber-500 text-white px-2 py-1 rounded-full ml-1 animate-pulse">
                  ▲ Ver
                </span>
              </span>
              <span className="text-2xl font-bold text-amber-400">
                R$ {cartTotal.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </main>

      {/* 4. COLUNA DIREITA (Carrinho Desktop) */}
      <div className="hidden xl:block w-[450px] h-full shadow-2xl z-20">
        <CartSidebar
          cartItems={cartItems}
          cartTotal={cartTotal}
          updateQuantity={updateQuantity}
          onCheckout={handleCheckout}
          isPlacingOrder={isPlacingOrder}
          cartSuggestion={cartSuggestion}
          menu={menu}
          onAddToCart={addToCart}
          observation={observation}
          setObservation={setObservation}
        />
      </div>

      {/* 5. DRAWER MOBILE EXPANDIDO */}
      {isMobileCartOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setIsMobileCartOpen(false)}
          />

          <CartSidebar
            cartItems={cartItems}
            cartTotal={cartTotal}
            updateQuantity={updateQuantity}
            onCheckout={handleCheckout}
            isPlacingOrder={isPlacingOrder}
            cartSuggestion={cartSuggestion}
            isMobile={true}
            onClose={() => setIsMobileCartOpen(false)}
            menu={menu}
            onAddToCart={addToCart}
            observation={observation}
            setObservation={setObservation}
          />
        </>
      )}
    </div>
  );
};

export default MenuPage;
