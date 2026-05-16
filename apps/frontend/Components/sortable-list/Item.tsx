import React, { ReactNode, useEffect } from 'react';
import { Dimensions, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  AnimatedRef,
  SharedValue,
  runOnJS,
  scrollTo,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  animationConfig,
  COL,
  getOrder,
  getPosition,
  Positions,
  SIZE,
} from './Config';

interface ItemProps {
  children: ReactNode;
  positions: SharedValue<Positions>;
  id: string;
  editing: boolean;
  onDragEnd: (positions: Positions) => void;
  scrollView: AnimatedRef<Animated.ScrollView>;
  scrollY: SharedValue<number>;
}

const Item = ({
  children,
  positions,
  id,
  editing,
  onDragEnd,
  scrollView,
  scrollY,
}: ItemProps) => {
  const insets = useSafeAreaInsets();
  const containerHeight =
    Dimensions.get('window').height - insets.top - insets.bottom;

  /** ---------- DERIVED VALUES (UI THREAD SAFE) ---------- */

  const contentHeight = useDerivedValue(() => {
    return (Object.keys(positions.value).length / COL) * SIZE;
  });

  const initialPosition = useDerivedValue(() => {
    return getPosition(positions.value[id]!);
  });

  /** ---------- SHARED VALUES ---------- */

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isGestureActive = useSharedValue(false);

  /** ---------- INITIAL POSITION SYNC ---------- */

  useEffect(() => {
    translateX.value = initialPosition.value.x;
    translateY.value = initialPosition.value.y;
  }, []);

  /** ---------- KEEP ITEMS IN SYNC ---------- */

  useAnimatedReaction(
    () => positions.value[id],
    (newOrder) => {
      if (!isGestureActive.value && newOrder !== undefined) {
        const pos = getPosition(newOrder);
        translateX.value = withTiming(pos.x, animationConfig);
        translateY.value = withTiming(pos.y, animationConfig);
      }
    }
  );

  /** ---------- PAN GESTURE ---------- */

  const pan = Gesture.Pan()
    .enabled(editing)
    .onBegin(() => {
      isGestureActive.value = true;
    })
    .onUpdate(({ translationX, translationY }) => {
      const base = initialPosition.value;

      translateX.value = base.x + translationX;
      translateY.value = base.y + translationY;

      const newOrder = getOrder(
        translateX.value,
        translateY.value,
        Object.keys(positions.value).length - 1
      );

      const oldOrder = positions.value[id];

      if (newOrder !== oldOrder) {
        const swapId = Object.keys(positions.value).find(
          (key) => positions.value[key] === newOrder
        );

        if (swapId) {
          const updated = { ...positions.value };
          updated[id] = newOrder;
          updated[swapId] = oldOrder!;
          positions.value = updated;
        }
      }

      /** ---------- AUTO SCROLL ---------- */

      const lowerBound = scrollY.value;
      const upperBound = lowerBound + containerHeight - SIZE;
      const maxScroll = contentHeight.value - containerHeight;
      const remainingScroll = maxScroll - scrollY.value;

      if (translateY.value < lowerBound) {
        const diff = Math.min(lowerBound - translateY.value, lowerBound);
        scrollY.value -= diff;
        scrollTo(scrollView, 0, scrollY.value, false);
      }

      if (translateY.value > upperBound) {
        const diff = Math.min(translateY.value - upperBound, remainingScroll);
        scrollY.value += diff;
        scrollTo(scrollView, 0, scrollY.value, false);
      }
    })
    .onEnd(() => {
      const pos = initialPosition.value;

      translateX.value = withTiming(pos.x, animationConfig, () => {
        isGestureActive.value = false;
        runOnJS(onDragEnd)(positions.value);
      });

      translateY.value = withTiming(pos.y, animationConfig);
    });

  /** ---------- ANIMATED STYLE ---------- */

  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      width: SIZE,
      height: SIZE,
      zIndex: isGestureActive.value ? 100 : 0,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: withSpring(isGestureActive.value ? 1.05 : 1) },
      ],
    } as ViewStyle;
  });

  return (
    <Animated.View style={animatedStyle}>
      <GestureDetector gesture={pan}>
        <Animated.View style={StyleSheet.absoluteFill}>
          {children}
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
};

export default Item;
