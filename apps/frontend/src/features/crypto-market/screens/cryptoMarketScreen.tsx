import { ActivityIndicator, StyleSheet, Text, View, Image, TouchableOpacity, ScrollView } from 'react-native';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Currency } from '@/features/crypto-market/types/cryptoMarketTypes';
import { useHeaderHeight } from '@react-navigation/elements';
import { Link } from 'expo-router';
import Colors from '@/shared/theme/colors';
import { defaultStyles } from '@/shared/theme/defaultStyles';
import { Ionicons } from '@expo/vector-icons';
import { formatEuroPrice } from '@/shared/formatting/formatEuroPrice';
import { getCryptoApiUrl } from '@/features/crypto-market/api/getCryptoApiUrl';
import { timeAsync } from '@/shared/metrics/metrics';

const CryptoMarketScreen = () => {
  const headerHeight = useHeaderHeight();

  const listingsQuery = useQuery({
    queryKey: ['listings'],
    queryFn: async () => {
      const res = await timeAsync(
        'crypto.client.listings.fetch',
        () => fetch(getCryptoApiUrl('/api/listings')),
        { endpoint: '/api/listings' }
      );
      if (!res.ok) throw new Error('Failed to fetch listings');
      return res.json();
    },
    refetchInterval: 60_000,
  });

  const currencies: Currency[] = listingsQuery.data ?? [];
  const ids = currencies.map((c) => c.id).join(',');

  const infoQuery = useQuery({
    queryKey: ['info', ids],
    enabled: !!ids,
    queryFn: async () => {
      if (!ids) throw new Error('Missing ids');
      const res = await timeAsync(
        'crypto.client.info.fetch',
        () => fetch(getCryptoApiUrl(`/api/info?ids=${ids}`)),
        { endpoint: '/api/info', ids }
      );
      if (!res.ok) throw new Error('Failed to fetch info');
      return res.json();
    },
    refetchInterval: 60_000,
  });

  const info = infoQuery.data ?? {};
  const onRefreshPrices = () => {
    listingsQuery.refetch();
    infoQuery.refetch();
  };

  const isLoading = listingsQuery.isLoading || (infoQuery.isLoading && !!ids);
  const isError = listingsQuery.isError || infoQuery.isError;
  const latestUpdatedAt = currencies
    .map((currency) => Date.parse(currency.quote.EUR.last_updated))
    .filter(Number.isFinite)
    .sort((a, b) => b - a)[0];

  return (
    <ScrollView
      style={{ backgroundColor: Colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: headerHeight + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Latest Crypto</Text>
          <Text style={styles.subtitle}>Live EUR prices from market APIs</Text>
          <Text style={styles.trustText}>Data source: CoinMarketCap</Text>
          <Text style={styles.trustText}>
            Last updated:{' '}
            {latestUpdatedAt
              ? new Date(latestUpdatedAt).toLocaleString()
              : 'Waiting for market data'}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefreshPrices}>
          <Ionicons name="refresh" size={18} color={Colors.primary} />
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listCard}>
        {isLoading && (
          <View style={styles.centerState}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.centerText}>Loading latest prices</Text>
          </View>
        )}

        {isError && (
          <View style={styles.centerState}>
            <Ionicons name="cloud-offline-outline" size={24} color={Colors.gray} />
            <Text style={styles.centerText}>Unable to refresh live prices.</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefreshPrices}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {currencies.map((currency) => (
          <Link
            key={currency.id}
            href={`/(authenticated)/crypto/${currency.id}`}
            asChild
          >
            <TouchableOpacity style={styles.row} activeOpacity={0.78}>
              {info[currency.id]?.logo ? (
                <Image
                  source={{ uri: info[currency.id].logo }}
                  style={styles.logo}
                />
              ) : (
                <View style={styles.logoFallback}>
                  <Text style={styles.logoFallbackText}>{currency.symbol.slice(0, 1)}</Text>
                </View>
              )}

              <View style={styles.nameColumn}>
                <Text style={styles.name}>
                  {currency.name}
                </Text>
                <Text style={styles.symbol}>
                  {currency.symbol} • Updated {new Date(currency.quote.EUR.last_updated).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              <View style={styles.priceColumn}>
                <Text style={styles.price}>{formatEuroPrice(currency.quote.EUR.price)}</Text>
                <View style={styles.changeRow}>
                  <Ionicons
                    name={
                      currency.quote.EUR.percent_change_24h > 0
                        ? 'caret-up'
                        : 'caret-down'
                    }
                    size={16}
                    color={
                      currency.quote.EUR.percent_change_24h > 0 ? '#0A8F5A' : '#C24135'
                    }
                  />
                  <Text
                    style={[
                      styles.changeText,
                      currency.quote.EUR.percent_change_24h > 0
                        ? styles.changePositive
                        : styles.changeNegative,
                    ]}
                  >
                    {currency.quote.EUR.percent_change_24h.toFixed(2)} %
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: 140,
  },
  headerRow: {
    marginHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.dark,
  },
  subtitle: {
    color: Colors.gray,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 3,
  },
  trustText: {
    color: Colors.gray,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  refreshButton: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 19,
    backgroundColor: '#EEF2FF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refreshText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  listCard: {
    ...defaultStyles.block,
    gap: 0,
    paddingVertical: 6,
    borderRadius: 22,
  },
  centerState: {
    minHeight: 110,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  centerText: {
    color: Colors.gray,
    fontSize: 14,
    fontWeight: '600',
  },
  retryButton: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
  },
  retryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    paddingVertical: 14,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  logoFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFallbackText: {
    color: Colors.primary,
    fontWeight: '800',
  },
  nameColumn: {
    flex: 1,
    gap: 5,
  },
  name: {
    fontWeight: '800',
    color: Colors.dark,
    fontSize: 16,
  },
  symbol: {
    color: Colors.gray,
    fontSize: 12,
    fontWeight: '600',
  },
  priceColumn: {
    gap: 6,
    alignItems: 'flex-end',
  },
  price: {
    color: Colors.dark,
    fontSize: 15,
    fontWeight: '800',
  },
  changeRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  changePositive: {
    color: '#0A8F5A',
  },
  changeNegative: {
    color: '#C24135',
  },
});

export default CryptoMarketScreen;
