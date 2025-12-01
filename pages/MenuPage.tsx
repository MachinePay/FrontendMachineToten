import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import {
  getMenuSuggestion,
  getDynamicCartSuggestion,
  getChefMessage,
} from "../services/geminiService";
import type { Product, CartItem } from "../types";

// URL da API
const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ==========================================
// 1. COMPONENTE: PRODUCT CARD
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
  const isOutOfStock = (product.stock ?? 0) === 0;
  const isLowStock = (product.stock ?? 0) > 0 && (product.stock ?? 0) < 10;

  return (
    <div
      className={`bg-white rounded-xl shadow-md overflow-hidden flex flex-col relative h-full transition-transform hover:shadow-lg ${
        isOutOfStock ? "opacity-60 grayscale" : ""
      }`}
    >
      {/* Badges */}
      {isOutOfStock && (
        <div className="absolute top-2 right-2 z-10 bg-red-600 text-white font-bold px-2 py-1 rounded text-xs shadow-sm">
          ESGOTADO
        </div>
      )}
      {isLowStock && (
        <div className="absolute top-2 right-2 z-10 bg-yellow-500 text-white font-bold px-2 py-1 rounded text-xs shadow-sm">
          Restam {product.stock}
        </div>
      )}

      {/* Mídia (Vídeo/Imagem) */}
      <div className="relative h-28 md:h-40 bg-gray-100">
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
      <div className="p-3 flex flex-col flex-grow justify-between">
        <div>
          <h3 className="font-bold text-xs md:text-base text-amber-900 leading-tight mb-1">
            {product.name}
          </h3>
          <p className="hidden md:block text-xs text-stone-500 line-clamp-2 mb-2">
            {product.description}
          </p>
        </div>

        <div className="mt-2">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
            <span className="text-sm md:text-lg font-bold text-stone-800">
              R${product.price.toFixed(2)}
            </span>
            <button
              onClick={() => onAddToCart(product)}
              disabled={isOutOfStock}
              className={`font-bold py-1.5 px-3 rounded-lg text-xs md:text-sm transition-colors shadow-sm w-full md:w-auto ${
                isOutOfStock
                  ? "bg-stone-300 text-stone-500 cursor-not-allowed"
                  : "bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700"
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
// 2. COMPONENTE: CART SIDEBAR (Desktop + Mobile Drawer)
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
  menu: Product[]; // Recebe o menu completo para achar o produto sugerido
  onAddToCart: (product: Product) => void; // Função para adicionar a sugestão
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
}) => {
  // Sem fundo preto (backdrop) no mobile, apenas uma sombra forte para separar
  const containerClass = isMobile
    ? "fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.3)] flex flex-col max-h-[85vh] transition-transform duration-300 ease-out transform translate-y-0 border-t border-stone-200"
    : "flex flex-col h-full bg-white border-l border-stone-200";

  // Lógica para encontrar o produto sugerido dentro do texto da IA
  const suggestedProduct = useMemo(() => {
    if (!cartSuggestion || !menu) return null;
    // Tenta encontrar um produto cujo nome esteja contido no texto da sugestão
    // Ex: "Que tal uma Coca-Cola?" -> encontra o produto "Coca-Cola Lata"
    return menu.find(
      (p) =>
        cartSuggestion.toLowerCase().includes(p.name.toLowerCase()) ||
        (p.name.toLowerCase().includes("coca") &&
          cartSuggestion.toLowerCase().includes("coca"))
    );
  }, [cartSuggestion, menu]);

  return (
    <div className={containerClass}>
      {/* Header do Carrinho */}
      <div
        className={`p-4 flex items-center justify-between ${
          isMobile
            ? "bg-stone-900 text-white rounded-t-3xl"
            : "bg-white border-b border-stone-100"
        }`}
      >
        <h2
          className={`text-xl font-bold flex items-center gap-2 ${
            isMobile ? "text-white" : "text-amber-800"
          }`}
        >
          <span>🛒</span> Minha Cesta (
          {cartItems.reduce((acc, i) => acc + i.quantity, 0)})
        </h2>
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white bg-stone-800 p-1 rounded-full w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
        )}
      </div>

      {/* Lista de Itens com Scroll */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50 min-h-0">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-stone-400">
            <span className="text-4xl mb-2">🛍️</span>
            <p>Seu carrinho está vazio.</p>
          </div>
        ) : (
          <>
            {/* SUGESTÃO DE UPSELL COM BOTÃO DE AÇÃO */}
            {cartSuggestion && (
              <div className="p-4 bg-gradient-to-r from-amber-100 to-orange-100 border-l-4 border-amber-500 rounded-lg shadow-sm mb-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✨</span>
                    <div>
                      <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">
                        Dica do Chef
                      </p>
                      <p className="text-sm text-amber-900 font-medium leading-tight">
                        {cartSuggestion}
                      </p>
                    </div>
                  </div>

                  {/* Se identificarmos o produto sugerido, mostra o botão */}
                  {suggestedProduct && (
                    <div className="mt-2 ml-10 flex items-center gap-3 bg-white/50 p-2 rounded-lg border border-amber-200/50">
                      {/* Miniatura Opcional */}
                      <div className="hidden xs:block w-10 h-10 bg-gray-200 rounded overflow-hidden shrink-0">
                        <video
                          src={suggestedProduct.videoUrl}
                          className="w-full h-full object-cover"
                          muted
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-amber-900 truncate">
                          {suggestedProduct.name}
                        </p>
                        <p className="text-xs text-amber-700">
                          R$ {suggestedProduct.price.toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => onAddToCart(suggestedProduct)}
                        className="bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-lg shadow hover:bg-amber-700 transition-colors whitespace-nowrap"
                      >
                        + Adicionar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex bg-white p-3 rounded-lg shadow-sm border border-stone-100 items-center justify-between"
              >
                <div className="flex-1 pr-2">
                  <p className="font-semibold text-stone-800 text-sm leading-tight">
                    {item.name}
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    R$ {item.price.toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-0 border border-stone-200 rounded-lg overflow-hidden h-8">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-full flex items-center justify-center bg-stone-100 text-stone-600 font-bold hover:bg-stone-200 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-8 h-full flex items-center justify-center text-sm font-bold bg-white border-x border-stone-100">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-full flex items-center justify-center bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors"
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
        <div className="p-4 bg-white border-t border-stone-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="flex justify-between items-center mb-4">
            <span className="text-stone-500 font-medium">Total</span>
            <span className="text-2xl font-bold text-stone-800">
              R$ {cartTotal.toFixed(2)}
            </span>
          </div>
          <button
            onClick={onCheckout}
            disabled={isPlacingOrder}
            className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors disabled:bg-stone-300 shadow-lg active:scale-[0.98] flex justify-center items-center gap-2"
          >
            {isPlacingOrder ? (
              "Processando..."
            ) : (
              <>
                <span>Finalizar Compra</span>
                <span>➜</span>
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
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <aside className="w-[85px] md:w-64 bg-white z-40 flex flex-col h-full border-r border-stone-200 shadow-xl overflow-hidden shrink-0">
      {/* Logo Area */}
      <div className="h-16 md:h-24 flex items-center justify-center border-b border-stone-100 bg-amber-500">
        <span className="md:hidden text-3xl">🍔</span>
        <h1 className="hidden md:block text-2xl font-extrabold text-white tracking-wide">
          MENU
        </h1>
      </div>

      {/* Menu Items Container */}
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-hide gap-4 pb-20">
        <button
          onClick={() => onSelectCategory(null)}
          className={`w-full py-4 px-1 md:px-6 flex flex-col md:flex-row items-center md:justify-start gap-1 md:gap-4 transition-all duration-200 border-l-4 ${
            selectedCategory === null
              ? "bg-amber-50 border-amber-600 text-amber-800"
              : "border-transparent bg-white text-stone-400 hover:bg-stone-50 hover:text-stone-600"
          }`}
        >
          <span
            className={`text-2xl md:text-3xl ${
              selectedCategory === null ? "scale-110" : "grayscale opacity-70"
            }`}
          >
            🔥
          </span>
          <span className="text-[10px] md:text-lg font-bold">Todos</span>
        </button>

        <div className="my-2 border-t border-stone-100 mx-4"></div>

        {categories.map((category) => {
          const isSelected = selectedCategory === category;
          let icon = "🍽️";
          const lowerCat = category.toLowerCase();
          if (lowerCat.includes("pastel")) icon = "🥟";
          if (lowerCat.includes("bebida")) icon = "🥤";
          if (lowerCat.includes("doce") || lowerCat.includes("sobremesa"))
            icon = "🍰";
          if (lowerCat.includes("combo")) icon = "🍱";
          if (lowerCat.includes("porção") || lowerCat.includes("fritas"))
            icon = "🍟";

          return (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              className={`w-full py-4 px-1 md:px-6 flex flex-col md:flex-row items-center md:justify-start gap-1 md:gap-4 transition-all duration-200 border-l-4 ${
                isSelected
                  ? "bg-amber-50 border-amber-600 text-amber-800"
                  : "border-transparent text-stone-400 hover:bg-stone-50 hover:text-stone-600 bg-white"
              }`}
            >
              <span
                className={`text-2xl md:text-3xl transition-transform ${
                  isSelected ? "scale-110" : "grayscale opacity-70"
                }`}
              >
                {icon}
              </span>
              <span
                className={`text-[10px] md:text-lg font-bold text-center md:text-left leading-tight`}
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

  const { currentUser } = useAuth();
  const { cartItems, addToCart, cartTotal, updateQuantity, clearCart } =
    useCart();
  const navigate = useNavigate();

  const fetchMenuData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/menu`);
      const data: Product[] = await response.json();
      setMenu(data);
    } catch (error) {
      console.error("Erro ao buscar menu:", error);
    }
  };

  useEffect(() => {
    fetchMenuData();
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
    return menu.reduce((acc, product) => {
      const categoryKey = product.category as Product["category"];
      if (!acc[categoryKey]) acc[categoryKey] = [];
      acc[categoryKey].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [menu]);

  return (
    <div className="flex h-screen w-full bg-stone-100 overflow-hidden font-sans">
      {/* 1. SIDEBAR ESQUERDA */}
      <CategorySidebar
        categories={Object.keys(categorizedMenu).sort()}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* 2. ÁREA CENTRAL */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Header Mobile */}
        <header className="md:hidden bg-white/90 backdrop-blur-md p-3 sticky top-0 z-20 border-b border-stone-200 shadow-sm flex justify-between items-center">
          <h2 className="font-bold text-amber-800 text-lg">
            {selectedCategory || "Cardápio"}
          </h2>
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">
            {currentUser?.name?.charAt(0) || "C"}
          </div>
        </header>

        {/* Scroll Container */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 pb-48 md:pb-6 scroll-smooth">
          {/* Mensagens IA */}
          <div className="max-w-5xl mx-auto space-y-4 mb-6">
            <div className="bg-white border-l-4 border-amber-400 p-3 rounded-r-lg shadow-sm">
              <h3 className="font-bold text-stone-800 text-xs flex items-center gap-2">
                👨‍🍳 Chef
              </h3>
              <p className="text-stone-600 text-xs mt-1">
                {isChefLoading ? "..." : chefMessage}
              </p>
            </div>

            {suggestion && !isSuggestionLoading && (
              <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg shadow-sm">
                <h3 className="font-bold text-orange-800 text-xs">
                  ✨ Sugestão
                </h3>
                <p className="text-orange-900 text-xs mt-1">{suggestion}</p>
              </div>
            )}
          </div>

          {/* Grid de Produtos */}
          <div className="max-w-5xl mx-auto min-h-[101%]">
            {selectedCategory === null ? (
              Object.entries(categorizedMenu).map(([category, products]) => (
                <div
                  key={category}
                  className="mb-8 scroll-mt-20"
                  id={`cat-${category}`}
                >
                  <h3 className="text-lg md:text-2xl font-bold text-stone-700 mb-3 flex items-center gap-2 border-b border-stone-200 pb-2">
                    {category}
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 md:gap-6">
                    {products.map((product) => (
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
                <h3 className="text-xl font-bold text-stone-700 mb-4 flex items-center gap-2">
                  {selectedCategory}
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 md:gap-6">
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
            style={{ width: "calc(100% - 85px)" }}
          >
            <div
              className="bg-stone-900 text-white px-4 py-3 flex justify-between items-center rounded-tl-xl cursor-pointer active:bg-stone-800 transition-colors"
              onClick={() => setIsMobileCartOpen(true)}
            >
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <span>🛒</span> Minha Cesta (
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)})
                <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full ml-1 animate-pulse">
                  ▲ Ver
                </span>
              </span>
              <span className="text-sm font-bold text-amber-400">
                R$ {cartTotal.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </main>

      {/* 4. COLUNA DIREITA (Carrinho Desktop) */}
      <div className="hidden xl:block w-96 h-full shadow-xl z-20">
        <CartSidebar
          cartItems={cartItems}
          cartTotal={cartTotal}
          updateQuantity={updateQuantity}
          onCheckout={handleCheckout}
          isPlacingOrder={isPlacingOrder}
          cartSuggestion={cartSuggestion}
          menu={menu}
          onAddToCart={addToCart}
        />
      </div>

      {/* 5. DRAWER MOBILE EXPANDIDO (COM OVERLAY TRANSPARENTE QUE FECHA) */}
      {isMobileCartOpen && (
        <>
          {/* Overlay Transparente para capturar o clique fora */}
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
          />
        </>
      )}
    </div>
  );
};

export default MenuPage;
