import React, { ReactNode, RefObject } from 'react';
import { Dimensions, StyleSheet, ScrollView } from 'react-native';
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
  runOnJS,
  scrollTo,
  SharedValue,
  AnimatedRef,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { animationConfig, COL, getOrder, getPosition, Positions, SIZE } from './Config';

interface ItemProps {
  children: ReactNode;
  positions: SharedValue<Positions>;
  id: string;
  editing: boolean;
  onDragEnd: (diffs: Positions) => void;
  scrollView: AnimatedRef<Animated.ScrollView>;
  scrollY: SharedValue<number>;
}

const Item = ({ children, positions, id, onDragEnd, scrollView, scrollY, editing }: ItemProps) => {
  const inset = useSafeAreaInsets();
  const containerHeight = Dimensions.get('window').height - inset.top - inset.bottom;
  const contentHeight = (Object.keys(positions.value).length / COL) * SIZE;
  const isGestureActive = useSharedValue(false);

  const initialPos = getPosition(positions.value[id]!);
  const translateX = useSharedValue(initialPos.x);
  const translateY = useSharedValue(initialPos.y);

  // Keep tiles synced when not dragging
  useAnimatedReaction(
    () => positions.value[id]!,
    (newOrder) => {
      if (!isGestureActive.value) {
        const pos = getPosition(newOrder);
        translateX.value = withTiming(pos.x, animationConfig);
        translateY.value = withTiming(pos.y, animationConfig);
      }
    }
  );

  // Pan gesture
  const pan = Gesture.Pan()
    .enabled(editing)
    .onBegin(() => {
      isGestureActive.value = true;
    })
    .onUpdate(({ translationX, translationY }) => {
      if (!editing) return;

      translateX.value = initialPos.x + translationX;
      translateY.value = initialPos.y + translationY;

      // 1. Calculate new order
      const newOrder = getOrder(
        translateX.value,
        translateY.value,
        Object.keys(positions.value).length - 1
      );

      // 2. Swap if necessary
      const oldOrder = positions.value[id];
      if (newOrder !== oldOrder) {
        const idToSwap = Object.keys(positions.value).find(
          (key) => positions.value[key] === newOrder
        );
        if (idToSwap) {
          const newPositions = { ...positions.value };
          newPositions[id] = newOrder;
          newPositions[idToSwap] = oldOrder!;
          positions.value = newPositions;
        }
      }

      // 3. Auto-scroll
      const lowerBound = scrollY.value;
      const upperBound = lowerBound + containerHeight - SIZE;
      const maxScroll = contentHeight - containerHeight;
      const leftToScrollDown = maxScroll - scrollY.value;

      if (translateY.value < lowerBound) {
        const diff = Math.min(lowerBound - translateY.value, lowerBound);
        scrollY.value -= diff;
        scrollTo(scrollView, 0, scrollY.value, false);
      }
      if (translateY.value > upperBound) {
        const diff = Math.min(translateY.value - upperBound, leftToScrollDown);
        scrollY.value += diff;
        scrollTo(scrollView, 0, scrollY.value, false);
      }
    })
    .onEnd(() => {
      const newPos = getPosition(positions.value[id]!);
      translateX.value = withTiming(newPos.x, animationConfig, () => {
        isGestureActive.value = false;
        runOnJS(onDragEnd)(positions.value);
      });
      translateY.value = withTiming(newPos.y, animationConfig);
    });

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    top: 0,
    left: 0,
    width: SIZE,
    height: SIZE,
    zIndex: isGestureActive.value ? 100 : 0,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: withSpring(isGestureActive.value ? 1.05 : 1) }
    ] as const,
  }));

  return (
    <Animated.View style={style}>
      <GestureDetector gesture={pan}>
        <Animated.View style={StyleSheet.absoluteFill}>{children}</Animated.View>
      </GestureDetector>
    </Animated.View>
  );
};

export default Item;
