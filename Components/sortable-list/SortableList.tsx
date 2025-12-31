import React, { ReactElement, useEffect, useMemo } from 'react';
import Animated, {
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';

import Item from './Item';
import { COL, Positions, SIZE } from './Config';

interface ListProps {
  children: ReactElement<{ id: string }>[];
  editing: boolean;
  onDragEnd: (positions: Positions) => void;
}

const List = ({ children, editing, onDragEnd }: ListProps) => {
  const scrollY = useSharedValue(0);
  const scrollView = useAnimatedRef<Animated.ScrollView>();
  const positions = useSharedValue<Positions>({});

  useEffect(() => {
    const initial: Positions = {};
    children.forEach((child, index) => {
      initial[child.props.id] = index;
    });
    positions.value = initial;
  }, [children, positions]);

  const contentHeight = useMemo(
    () => Math.ceil(children.length / COL) * SIZE,
    [children.length],
  );

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  return (
    <Animated.ScrollView
      ref={scrollView}
      onScroll={onScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      bounces={false}
      contentContainerStyle={{
        height: contentHeight,
      }}
    >
      {children.map((child) => (
        <Item
          key={child.props.id}
          id={child.props.id}
          positions={positions}
          editing={editing}
          onDragEnd={onDragEnd}
          scrollView={scrollView}
          scrollY={scrollY}
        >
          {child}
        </Item>
      ))}
    </Animated.ScrollView>
  );
};

export default List;
