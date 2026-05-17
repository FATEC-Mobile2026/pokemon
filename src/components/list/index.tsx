import React from 'react';
import { ViewStyle } from 'react-native';
import { styles } from "./styles";
import { FlatList } from 'react-native';

import { Card } from '@/components/card';

interface ListProps {
  data: any[];
  onLoadMore: () => void;
  renderItemContent: (item: any) => React.ReactNode;
  cardStyle?: (item: any) => ViewStyle;
}

export function List({
  data,
  onLoadMore,
  renderItemContent,
  cardStyle,
}: ListProps) {
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => String(item.id ?? item.index)}
      renderItem={({ item }) => (
        <Card style={[styles.cardMargin, cardStyle?.(item)]}>
          {renderItemContent(item)}
        </Card>
      )}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.2}
      contentContainerStyle={styles.container}
    />
  );
}

