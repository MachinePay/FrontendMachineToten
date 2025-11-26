import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom"; // Importando useNavigate
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import {
  getMenuSuggestion,
  getDynamicCartSuggestion,
  getChefMessage,
} from "../services/geminiService";
import type { Product, CartItem } from "../types";

// Usamos uma URL fixa (ou VITE_API_URL, se estiver no service)
const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// --- Componentes auxiliares definidos fora para evitar re-renderizações ---

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  quantityInCart?: number; // quantidade atual deste produto no carrinho
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  quantityInCart = 0,
}) => {
  const isOutOfStock = (product.stock ?? 0) === 0;
  const isLowStock = (product.stock ?? 0) > 0 && (product.stock ?? 0) < 10;
  
  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 flex flex-col relative ${
      isOutOfStock ? 'opacity-60' : ''
    }`}>
      {/* Badge de ESGOTADO */}
      {isOutOfStock && (
        <div className="absolute top-2 right-2 z-10 bg-red-600 text-white font-bold px-3 py-1 rounded-full text-sm shadow-lg">
          ESGOTADO
        </div>
      )}
      {/* Badge de estoque baixo */}
      {isLowStock && (
        <div className="absolute top-2 right-2 z-10 bg-yellow-500 text-white font-bold px-3 py-1 rounded-full text-xs shadow-lg">
          Últimas {product.stock} un.
        </div>
      )}
      <video
        className="w-full h-40 object-cover"
        autoPlay
        muted
        loop
        playsInline
        onClick={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLVideoElement).play().catch(() => {});
        }}
        onPause={(e) => {
          (e.currentTarget as HTMLVideoElement).play().catch(() => {});
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <source src={product.videoUrl} type="video/mp4" />
      </video>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-lg text-amber-800">{product.name}</h3>
        <p className="text-stone-600 text-sm mt-1 flex-grow">
          {product.description}
        </p>
        <div className="flex justify-between items-center mt-4">
          <div className="flex flex-col">
            <span className="text-xl font-semibold text-stone-800">
              R${product.price.toFixed(2)}
            </span>
            {!isOutOfStock && (product.stock ?? 0) < 50 && (
              <span className="text-xs text-stone-500 mt-1">
                Estoque: {product.stock} un.
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {quantityInCart > 0 && (
              <span className="bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full text-sm">
                {quantityInCart} no carrinho
              </span>
            )}
            <button
              onClick={() => onAddToCart(product)}
              disabled={isOutOfStock}
              className={`font-bold py-2 px-4 rounded-lg transition-colors ${
                isOutOfStock 
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed' 
                  : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
            >
              {isOutOfStock ? 'Indisponível' : 'Adicionar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// CartSidebar atualizado para suportar modo mobile drawer
interface CartSidebarProps {
  cartItems: CartItem[];
  cartTotal: number;
  updateQuantity: (id: string, q: number) => void;
  onCheckout: () => void;
  isPlacingOrder: boolean;
  cartSuggestion?: string;
  // props novos:
  isMobile?: boolean; // quando true renderiza como drawer full-screen
  onClose?: () => void; // usado no mobile para fechar
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
}) => {
  // classes diferentes para mobile vs desktop
  const containerClass = isMobile
    ? "fixed inset-x-0 bottom-0 top-0 bg-white p-6 rounded-t-2xl shadow-xl z-50 flex flex-col"
    : "hidden lg:flex w-full lg:w-1/3 xl:w-1/4 bg-white p-6 rounded-2xl shadow-xl lg:relative lg:h-fit lg:sticky lg:top-24 flex flex-col";

  return (
    <div className={containerClass}>
      {isMobile && (
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-amber-800">Seu Pedido</h2>
          <button
            onClick={onClose}
            className="text-stone-600 bg-stone-100 p-2 rounded-full"
            aria-label="Fechar carrinho"
          >
            ✕
          </button>
        </div>
      )}
      {!isMobile && (
        <h2 className="text-2xl font-bold text-amber-800 border-b-2 border-amber-200 pb-2 mb-4">
          Seu Pedido
        </h2>
      )}
      {cartItems.length === 0 ? (
        <p className="text-stone-500">Seu carrinho está vazio.</p>
      ) : (
        <>
          {cartSuggestion && (
            <div className="mb-4 p-3 bg-amber-50 border-l-4 border-amber-500 rounded text-sm text-amber-800 italic">
              💡 {cartSuggestion}
            </div>
          )}
          <div className="space-y-4 overflow-y-auto pr-2 flex-1 max-h-[60vh]">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-stone-500">
                    R${item.price.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateQuantity(item.id, parseInt(e.target.value))
                    }
                    className="w-14 text-center border rounded"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t-2 border-dashed border-amber-300">
            <div className="flex justify-between font-bold text-xl">
              <span>Total</span>
              <span>R${cartTotal.toFixed(2)}</span>
            </div>
            <button
              onClick={onCheckout}
              disabled={isPlacingOrder}
              className="w-full mt-4 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-300 disabled:cursor-wait"
            >
              {isPlacingOrder ? "Carregando..." : "Ir para Pagamento"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// --- Componente CategorySidebar (Sidebar de Categorias) ---

interface CategorySidebarProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  isMobile?: boolean;
  onClose?: () => void;
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  isMobile = false,
  onClose,
}) => {
  const containerClass = isMobile
    ? "fixed inset-x-0 left-0 top-0 bottom-0 w-64 bg-white shadow-lg z-40 flex flex-col p-4"
    : "hidden lg:flex flex-col w-48 bg-white rounded-2xl shadow-xl p-4 h-fit sticky top-24";

  return (
    <div className={containerClass}>
      {isMobile && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-amber-800">Categorias</h2>
          <button
            onClick={onClose}
            className="text-stone-600 bg-stone-100 p-2 rounded-full"
            aria-label="Fechar categorias"
          >
            ✕
          </button>
        </div>
      )}

      {!isMobile && (
        <h3 className="text-xl font-bold text-amber-800 mb-4">Categorias</h3>
      )}

      <button
        onClick={() => onSelectCategory(null)}
        className={`w-full py-3 px-4 rounded-lg font-semibold mb-2 text-left transition-all ${
          selectedCategory === null
            ? "bg-amber-500 text-white shadow-lg"
            : "bg-stone-100 text-stone-800 hover:bg-stone-200"
        }`}
      >
        🔥 Todos
      </button>

      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelectCategory(category)}
          className={`w-full py-3 px-4 rounded-lg font-semibold mb-2 text-left transition-all ${
            selectedCategory === category
              ? "bg-amber-500 text-white shadow-lg"
              : "bg-stone-100 text-stone-800 hover:bg-stone-200"
          }`}
        >
          {category === "Pastel" && "🥟 Pastéis"}
          {category === "Bebida" && "🥤 Bebidas"}
          {category === "Doce" && "🍰 Doces"}
        </button>
      ))}
    </div>
  );
};

// --- Componente Principal da Página do Menu ---

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
  const [isMobileCategoryOpen, setIsMobileCategoryOpen] = useState(false);

  const { currentUser } = useAuth();
  const { cartItems, addToCart, cartTotal, updateQuantity } = useCart();
  const navigate = useNavigate(); // Hook de navegação

  // Função para buscar o menu do backend (DB)
  const fetchMenuData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/menu`);
      const data: Product[] = await response.json();
      setMenu(data);
    } catch (error) {
      console.error("Erro ao buscar menu do DB:", error);
    }
  };

  // Carrega o menu na montagem do componente
  useEffect(() => {
    fetchMenuData();
  }, []);

  // UseEffect para Sugestão do Menu (Recomendação IA)
  useEffect(() => {
    const fetchSuggestion = async () => {
      if (currentUser) {
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
    if (menu.length > 0) {
      fetchSuggestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems, currentUser, menu]);

  // UseEffect para Mensagem do Chef (Boas-Vindas)
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
        console.error("Error fetching chef message:", err);
        setChefMessage("O Chef está preparando uma surpresa para você!");
      } finally {
        setIsChefLoading(false);
      }
    };
    fetchChefMessage();
  }, [menu, currentUser]);

  // UseEffect para Sugestão Dinâmica do Carrinho (Upsell)
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
  }, [cartItems, menu, currentUser?.name]);

  // Lógica de checkout alterada para redirecionar para a página de pagamento
  const handleCheckout = () => {
    if (!currentUser || cartItems.length === 0) return;
    // Em vez de chamar API diretamente, navegamos para a tela de pagamento
    navigate("/payment");
  };

  // Memoiza a lista de produtos categorizados para evitar recalcular a cada render
  const categorizedMenu = useMemo(() => {
    return menu.reduce((acc, product) => {
      const categoryKey = product.category as Product["category"];
      if (!acc[categoryKey]) {
        acc[categoryKey] = [];
      }
      acc[categoryKey].push(product);
      return acc;
    }, {} as Record<Product["category"], Product[]>);
  }, [menu]);

  return (
    <>
      <div className="container mx-auto flex flex-col md:flex-row gap-8 md:mb-40">
        {/* Sidebar de Categorias - Desktop */}
        <CategorySidebar
          categories={Object.keys(categorizedMenu).sort()}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        <div className="w-full flex-1">
          <div className="bg-amber-50 border-l-4 border-amber-400 text-amber-800 p-4 rounded-lg mb-4 shadow">
            <h3 className="font-bold">Mensagem Especial do Chef</h3>
            {isChefLoading ? (
              <p className="italic">O Chef está preparando algo especial...</p>
            ) : (
              <p>{chefMessage}</p>
            )}
          </div>

          {isSuggestionLoading ? (
            <div className="bg-orange-50 border-l-4 border-orange-400 text-orange-800 p-4 rounded-lg mb-4 shadow">
              <p className="italic">Gerando sugestão de IA...</p>
            </div>
          ) : (
            suggestion && (
              <div className="bg-orange-50 border-l-4 border-orange-400 text-orange-800 p-4 rounded-lg mb-4 shadow">
                <h3 className="font-bold">Sugestão de Venda</h3>
                <p>{suggestion}</p>
              </div>
            )
          )}

          {selectedCategory === null ? (
            // Mostrar todas as categorias
            Object.entries(categorizedMenu).map(
              ([category, products]: [string, Product[]]) => (
                <div key={category} className="mb-12">
                  <h2 className="text-3xl font-bold text-amber-800 mb-6 border-b-2 border-amber-200 pb-2">
                    {category === "Pastel" && "🥟 Pastéis"}
                    {category === "Bebida" && "🥤 Bebidas"}
                    {category === "Doce" && "🍰 Doces"}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={addToCart}
                        quantityInCart={
                          cartItems.find((item) => item.id === product.id)
                            ?.quantity || 0
                        }
                      />
                    ))}
                  </div>
                </div>
              )
            )
          ) : (
            // Mostrar apenas a categoria selecionada
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-amber-800 mb-6 border-b-2 border-amber-200 pb-2">
                {selectedCategory === "Pastel" && "🥟 Pastéis"}
                {selectedCategory === "Bebida" && "🥤 Bebidas"}
                {selectedCategory === "Doce" && "🍰 Doces"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {categorizedMenu[selectedCategory as Product["category"]]?.map(
                  (product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={addToCart}
                      quantityInCart={
                        cartItems.find((item) => item.id === product.id)
                          ?.quantity || 0
                      }
                    />
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Versão desktop do cart (visível apenas em lg+) */}
        <CartSidebar
          cartItems={cartItems}
          cartTotal={cartTotal}
          updateQuantity={updateQuantity}
          onCheckout={handleCheckout}
          isPlacingOrder={isPlacingOrder}
          cartSuggestion={cartSuggestion}
          // isMobile não passado => desktop behavior
        />
      </div>

      {/* Botões flutuantes mobile - Bolinhas pequenas */}
      <div className="lg:hidden fixed bottom-6 left-6 z-40 flex flex-col gap-3">
        {/* Botão Carrinho */}
        <button
          className="bg-amber-500 text-white p-3 rounded-full shadow-lg hover:bg-amber-600 transition-all flex items-center justify-center w-14 h-14 animate-pulse"
          onClick={() => setIsMobileCartOpen(true)}
          aria-label="Abrir carrinho"
          title="Carrinho"
        >
          <span className="text-2xl">🧺</span>
          {cartItems.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {cartItems.length}
            </span>
          )}
        </button>

        {/* Botão Categorias */}
        <button
          className="bg-amber-600 text-white p-3 rounded-full shadow-lg hover:bg-amber-700 transition-all flex items-center justify-center w-14 h-14"
          onClick={() => setIsMobileCategoryOpen(!isMobileCategoryOpen)}
          aria-label="Abrir categorias"
          title="Categorias"
        >
          <span className="text-2xl">📋</span>
        </button>
      </div>

      {/* Drawer mobile */}
      {/* Drawer de categorias mobile */}
      {isMobileCategoryOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setIsMobileCategoryOpen(false)}
          />
          <CategorySidebar
            categories={Object.keys(categorizedMenu).sort()}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setIsMobileCategoryOpen(false);
            }}
            isMobile
            onClose={() => setIsMobileCategoryOpen(false)}
          />
        </>
      )}

      {isMobileCartOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setIsMobileCartOpen(false)}
          />
          <CartSidebar
            cartItems={cartItems}
            cartTotal={cartTotal}
            updateQuantity={updateQuantity}
            onCheckout={handleCheckout}
            isPlacingOrder={isPlacingOrder}
            cartSuggestion={cartSuggestion}
            isMobile
            onClose={() => setIsMobileCartOpen(false)}
          />
        </>
      )}
    </>
  );
};

export default MenuPage;
