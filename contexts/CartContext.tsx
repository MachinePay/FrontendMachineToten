import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import type { CartItem, Product } from "../types";

/*
  Define o formato do contexto do carrinho.
  - cartItems: lista de itens no carrinho
  - addToCart: adiciona um produto (ou incrementa quantidade se já existir)
  - removeFromCart: remove um item pelo id
  - updateQuantity: atualiza a quantidade de um item (se <= 0 remove)
  - clearCart: esvazia o carrinho
  - cartTotal: total calculado do carrinho
*/
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  observation: string;
  setObservation: (obs: string) => void;
}

// Cria o contexto com tipo opcional (undefined por padrão até o Provider ser usado)
const CartContext = createContext<CartContextType | undefined>(undefined);

/*
  Provider do contexto do carrinho.
  Envolve a árvore de componentes que precisa acessar o carrinho.
  Recebe children como propriedade.
*/
export const CartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // 1. Inicialização Inteligente: Tenta ler do LocalStorage primeiro
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem("kiosk_cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Erro ao recuperar carrinho:", error);
      return [];
    }
  });

  const [observation, setObservation] = useState<string>(() => {
    try {
      return localStorage.getItem("kiosk_observation") || "";
    } catch (error) {
      console.error("Erro ao recuperar observação:", error);
      return "";
    }
  });

  // 2. Efeito de Persistência: Salva no LocalStorage sempre que o carrinho mudar
  useEffect(() => {
    try {
      localStorage.setItem("kiosk_cart", JSON.stringify(cartItems));
    } catch (error) {
      console.error("Erro ao salvar carrinho:", error);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem("kiosk_observation", observation);
    } catch (error) {
      console.error("Erro ao salvar observação:", error);
    }
  }, [observation]);

  /*
    Adiciona um produto ao carrinho.
    - Valida se o produto tem estoque disponível (stock > 0)
    - Se o produto já existir (mesmo id), incrementa a quantidade em 1 (se houver estoque)
    - Caso contrário, adiciona o produto com quantity = 1.
    Usa a função de atualização baseada no estado anterior para evitar condições de corrida.
  */
  const addToCart = (product: Product) => {
    // Validação de estoque
    if ((product.stock ?? 0) === 0) {
      alert("Produto esgotado!");
      return;
    }

    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      if (existingItem) {
        // Verifica se a quantidade no carrinho já atingiu o estoque disponível
        if (
          product.stock !== undefined &&
          existingItem.quantity >= product.stock
        ) {
          alert(
            `Estoque limitado! Máximo de ${product.stock} unidades disponíveis.`
          );
          return prevItems;
        }
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  /*
    Remove um item do carrinho pelo productId.
    Filtra os itens mantendo apenas os que não possuem o id informado.
  */
  const removeFromCart = (productId: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id !== productId)
    );
  };

  /*
    Atualiza a quantidade de um item.
    - Se a quantidade informada for menor ou igual a zero, remove o item.
    - Caso contrário, mapeia os itens e atualiza a quantidade do item correspondente.
  */
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  // Limpa o carrinho, definindo a lista de itens como vazia
  // O useEffect atualizará o localStorage automaticamente
  const clearCart = () => {
    setCartItems([]);
    setObservation("");
  };

  // Calcula o total do carrinho somando price * quantity de cada item
  const cartTotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Fornece o estado e as funções do carrinho para os componentes filhos
  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        observation,
        setObservation,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

/*
  Hook customizado para consumir o contexto do carrinho.
  Lança um erro se usado fora do CartProvider, ajudando a detectar uso incorreto.
*/
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
