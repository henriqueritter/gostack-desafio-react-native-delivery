import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];

  category?: number;
  thumbnail_url?: string;
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      await api.get(`foods/${routeParams.id}`).then(response => {
        setFood({
          ...response.data,
          formattedPrice: formatValue(response.data.price),
        });

        setExtras(
          response.data.extras.map((extra: Omit<Extra, 'quantity'>) => ({
            ...extra,
            quantity: 0,
          })),
        );
      });
    }

    loadFood();
  }, [routeParams]);

  // Load Favorite Status from API
  useEffect(() => {
    async function loadFavorite(): Promise<void> {
      await api
        .get(`favorites/${routeParams.id}`)
        .then(response => {
          if (response.data) {
            setIsFavorite(true);
          } else {
            setIsFavorite(false);
          }
        })
        .catch(err => {});
    }

    loadFavorite();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    // setExtras(...extras, extras.quantity + 1);
    setExtras(
      extras.map(extra =>
        extra.id === id ? { ...extra, quantity: extra.quantity + 1 } : extra,
      ),
    );
  }

  function handleDecrementExtra(id: number): void {
    // Decrement extra quantity
    const itemExtra = extras.find(extra => extra.id === id);
    if (itemExtra) {
      if (itemExtra.quantity > 0) {
        setExtras(
          extras.map(extra =>
            extra.id === id
              ? { ...extra, quantity: extra.quantity - 1 }
              : extra,
          ),
        );
      }
    }
  }

  function handleIncrementFood(): void {
    setFoodQuantity(foodQuantity + 1);
  }

  function handleDecrementFood(): void {
    if (foodQuantity > 1) {
      setFoodQuantity(foodQuantity - 1);
    }
  }

  const toggleFavorite = useCallback(() => {
    async function favoriteFood(): Promise<void> {
      if (isFavorite) {
        await api.delete(`/favorites/${food.id}`);
      } else {
        await api.post('favorites', food);
      }

      setIsFavorite(!isFavorite);
    }
    favoriteFood();
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    const extraTotal = extras.reduce((accumulator, extra) => {
      return accumulator + extra.quantity * extra.value;
    }, 0);

    const foodTotal = food.price;

    return formatValue((extraTotal + foodTotal) * foodQuantity);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    // Finish the order and save on the API
    // const foodData: Food = api.get(`foods/${food.id}`);
    const extraTotal = extras.reduce((accumulator, extra) => {
      return accumulator + extra.quantity * extra.value;
    }, 0);

    const foodTotal = food.price;

    const foodPrice = (extraTotal + foodTotal) * foodQuantity;

    // const order = {
    //   ,
    // };
    try {
      await api.post('orders', {
        product_id: food.id,
        name: food.name,
        description: food.description,
        price: foodPrice,
        category: food.category,
        thumbnail_url: food.thumbnail_url,
        extras,
      });

      navigation.goBack();
    } catch (err) {}
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
