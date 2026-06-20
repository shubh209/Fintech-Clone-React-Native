import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { CartesianChart, Line, useChartPressState } from 'victory-native';
import { Circle, useFont } from '@shopify/react-native-skia';
import { runOnJS, SharedValue, useAnimatedReaction } from 'react-native-reanimated';

import { getPurchasingPowerComparisons } from '@/features/simulation/api/getPurchasingPowerComparisons';
import { getSimulationAssets } from '@/features/simulation/api/getSimulationAssets';
import { getSimulationEventScenario } from '@/features/simulation/api/getSimulationEventScenario';
import { getSimulationEvents } from '@/features/simulation/api/getSimulationEvents';
import { getSimulationHistory } from '@/features/simulation/api/getSimulationHistory';
import { getSimulationPrice } from '@/features/simulation/api/getSimulationPrice';
import {
  listSavedSimulations,
  saveSimulation as saveSimulationSnapshot,
  SavedSimulation,
} from '@/features/simulation/storage/savedSimulationsStore';
import Colors from '@/shared/theme/colors';
import { defaultStyles } from '@/shared/theme/defaultStyles';
import { recordMetric } from '@/shared/metrics/metrics';
import {
  SimulationAssetSymbol,
  SimulationEventDelay,
  SimulationEventScenarioResponse,
  SimulationEventScenarioSuccessResponse,
  SimulationHistoryPoint,
  SimulationPriceResponse,
  SimulationPriceSuccessResponse,
} from '@shared/simulationTypes';
import {
  PurchasingPowerCityId,
  PurchasingPowerComparison,
} from '@shared/purchasingPowerTypes';

const MIN_SIMULATION_DATE = '2014-09-17';
const MAX_SIMULATION_DATE = '2026-03-22';

type SimulationMode = 'date' | 'event';

const EVENT_DELAYS: Array<{ value: SimulationEventDelay; label: string }> = [
  { value: 'same_day', label: 'Same day' },
  { value: 'one_week', label: '1 week' },
  { value: 'one_month', label: '1 month' },
];

const SIMULATION_ASSETS: Array<{
  symbol: SimulationAssetSymbol;
  name: string;
  firstDate: string;
}> = [
  { symbol: 'BTC', name: 'Bitcoin', firstDate: '2014-09-17' },
  { symbol: 'ETH', name: 'Ethereum', firstDate: '2017-11-09' },
  { symbol: 'SOL', name: 'Solana', firstDate: '2020-04-10' },
];

const PURCHASING_POWER_CITIES: Array<{
  id: PurchasingPowerCityId;
  name: string;
  shortName: string;
}> = [
  { id: 'phoenix', name: 'Phoenix', shortName: 'Phoenix' },
  { id: 'san_francisco', name: 'San Francisco', shortName: 'SF' },
  { id: 'new_york', name: 'New York', shortName: 'NYC' },
  { id: 'austin', name: 'Austin', shortName: 'Austin' },
  { id: 'seattle', name: 'Seattle', shortName: 'Seattle' },
];

function formatUsd(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 100 ? 2 : 4,
  }).format(value);
}

function formatPercent(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function formatCompactUsd(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatAxisUsdLabel(value: number) {
  if (Math.abs(value) >= 1000) {
    return `${Math.round(value / 1000)}K`;
  }

  return `${Math.round(value)}`;
}

function monthLabel(date: string) {
  return new Date(`${date}T00:00:00.000Z`).toLocaleString('en-US', { month: 'short' });
}

function getMonthPoints(points: SimulationHistoryPoint[]) {
  const byMonth = new Map<string, SimulationHistoryPoint>();

  points.forEach((point) => {
    const month = point.date.slice(0, 7);
    if (!byMonth.has(month)) byMonth.set(month, point);
  });

  return [...byMonth.values()];
}

function getYearRange(startDate: string, endDate: string) {
  const startYear = Number(startDate.slice(0, 4));
  const endYear = Number(endDate.slice(0, 4));

  return Array.from({ length: endYear - startYear + 1 }, (_, index) => startYear + index);
}

function isSuccessfulResult(
  result: SimulationPriceResponse | SimulationEventScenarioResponse | null
): result is SimulationPriceSuccessResponse {
  return result?.status === 'success';
}

function ChartToolTip({
  x,
  y,
}: {
  x: SharedValue<number>;
  y: SharedValue<number>;
}) {
  return <Circle cx={x} cy={y} r={7} color="#F2827F" />;
}

function ComparisonRows({ items }: { items: PurchasingPowerComparison[] }) {
  return (
    <View style={styles.comparisonList}>
      {items.map((item) => (
        <View key={item.itemId} style={styles.comparisonRow}>
          <View style={styles.comparisonCopy}>
            <Text style={styles.comparisonTitle}>{item.label}</Text>
            <Text style={styles.comparisonMeta}>{formatUsd(item.costUsd)} baseline</Text>
          </View>
          <Text style={styles.comparisonQuantity}>{item.quantity.toFixed(2)}x</Text>
        </View>
      ))}
    </View>
  );
}

export default function SimulationScreen() {
  const headerHeight = useHeaderHeight();
  const chartFont = useFont(require('@assets/fonts/SpaceMono-Regular.ttf'), 10);
  const chartPress = useChartPressState({
    x: 0,
    y: { price: 0 },
  }) as any;
  const { state: chartPressState, isActive: isChartPressActive } = chartPress;
  const [asset, setAsset] = useState<SimulationAssetSymbol>('BTC');
  const [mode, setMode] = useState<SimulationMode>('date');
  const [selectedYear, setSelectedYear] = useState(2014);
  const [date, setDate] = useState('2014-09-17');
  const [amountUsd, setAmountUsd] = useState('100');
  const [latestResult, setLatestResult] = useState<
    SimulationPriceResponse | SimulationEventScenarioResponse | null
  >(null);
  const [latestEventResult, setLatestEventResult] =
    useState<SimulationEventScenarioSuccessResponse | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedDelay, setSelectedDelay] = useState<SimulationEventDelay>('same_day');
  const [savedItems, setSavedItems] = useState<SavedSimulation[]>([]);
  const [saveMessage, setSaveMessage] = useState('');
  const [selectedCity, setSelectedCity] = useState<PurchasingPowerCityId>('phoenix');

  const selectedAsset = useMemo(
    () => SIMULATION_ASSETS.find((item) => item.symbol === asset) ?? SIMULATION_ASSETS[0],
    [asset]
  );
  const simulationYears = useMemo(
    () => getYearRange(selectedAsset.firstDate, MAX_SIMULATION_DATE),
    [selectedAsset.firstDate]
  );

  const historyQuery = useQuery({
    queryKey: ['simulation-history', asset, selectedYear],
    queryFn: () => getSimulationHistory({ asset, year: selectedYear }),
  });
  const assetCatalogQuery = useQuery({
    queryKey: ['simulation-assets'],
    queryFn: getSimulationAssets,
  });
  const eventsQuery = useQuery({
    queryKey: ['simulation-events', asset],
    queryFn: () => getSimulationEvents({ asset }),
    enabled: mode === 'event',
  });
  const assetCatalog =
    assetCatalogQuery.data?.status === 'success' ? assetCatalogQuery.data : null;
  const catalogReadyCount = assetCatalog?.assets.ready.length ?? 0;
  const catalogUnavailableCount = assetCatalog?.assets.unavailable.length ?? 0;
  const topCatalogAssets = useMemo(
    () =>
      [...(assetCatalog?.assets.ready ?? [])]
        .sort((left, right) => (left.market.rank ?? 9999) - (right.market.rank ?? 9999))
        .slice(0, 3),
    [assetCatalog]
  );
  const firstUnavailableAsset = assetCatalog?.assets.unavailable[0] ?? null;
  const successfulResult = isSuccessfulResult(latestResult) ? latestResult : null;
  const eventList = eventsQuery.data?.status === 'success' ? eventsQuery.data.events : [];
  const selectedEvent =
    eventList.find((event) => event.id === selectedEventId) ?? eventList[0] ?? null;
  const purchasingPowerQuery = useQuery({
    queryKey: [
      'purchasing-power',
      selectedCity,
      successfulResult?.result.currentValueUsd ?? null,
    ],
    queryFn: () =>
      getPurchasingPowerComparisons({
        city: selectedCity,
        amountUsd: successfulResult?.result.currentValueUsd ?? 0,
      }),
    enabled: !!successfulResult,
  });
  const purchasingPower =
    purchasingPowerQuery.data?.status === 'success' ? purchasingPowerQuery.data : null;

  const history = historyQuery.data?.status === 'success' ? historyQuery.data : null;
  const historyPoints = history?.points ?? [];
  const chartData = useMemo(
    () =>
      historyPoints.map((point) => ({
        timestamp: Date.parse(`${point.date}T00:00:00.000Z`),
        price: point.priceUsd,
        date: point.date,
      })),
    [historyPoints]
  );
  const monthPoints = useMemo(() => getMonthPoints(historyPoints), [historyPoints]);
  const selectedPoint =
    historyPoints.find((point) => point.date === date) ?? historyPoints[0] ?? null;
  const firstPoint = historyPoints[0] ?? null;
  const latestPoint = historyPoints[historyPoints.length - 1] ?? null;
  const historyChangePercent =
    firstPoint && latestPoint
      ? ((latestPoint.priceUsd - firstPoint.priceUsd) / firstPoint.priceUsd) * 100
      : 0;

  const selectNearestChartDate = useCallback(
    (timestamp: number) => {
      if (historyPoints.length === 0 || !Number.isFinite(timestamp)) return;

      const nearest = historyPoints.reduce((closest, point) => {
        const pointTime = Date.parse(`${point.date}T00:00:00.000Z`);
        const closestTime = Date.parse(`${closest.date}T00:00:00.000Z`);
        return Math.abs(pointTime - timestamp) < Math.abs(closestTime - timestamp)
          ? point
          : closest;
      }, historyPoints[0]);

      setDate(nearest.date);
    },
    [historyPoints]
  );

  useAnimatedReaction(
    () => chartPressState.x.value.value,
    (timestamp) => {
      if (isChartPressActive && Number.isFinite(timestamp)) {
        runOnJS(selectNearestChartDate)(timestamp);
      }
    },
    [isChartPressActive, selectNearestChartDate]
  );

  useEffect(() => {
    if (!history || history.points.length === 0) return;
    const dateIsInLoadedRange = date >= history.range.startDate && date <= history.range.endDate;
    if (!dateIsInLoadedRange) {
      setDate(history.points[0].date);
    }
  }, [date, history]);

  const numericAmount = Number(amountUsd);
  const canRunSimulation =
    Number.isFinite(numericAmount) &&
    numericAmount > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    date >= MIN_SIMULATION_DATE &&
    date <= MAX_SIMULATION_DATE;
  const canRunEventSimulation =
    Number.isFinite(numericAmount) && numericAmount > 0 && selectedEvent !== null;

  const selectAsset = (nextAsset: (typeof SIMULATION_ASSETS)[number]) => {
    setAsset(nextAsset.symbol);
    setSelectedYear(Number(nextAsset.firstDate.slice(0, 4)));
    setDate(nextAsset.firstDate);
    setLatestResult(null);
    setLatestEventResult(null);
    setSelectedEventId(null);
    setSaveMessage('');
  };

  const selectMode = (nextMode: SimulationMode) => {
    setMode(nextMode);
    setLatestResult(null);
    setLatestEventResult(null);
    setSaveMessage('');
  };

  const refreshSavedItems = async () => {
    setSavedItems(await listSavedSimulations());
  };

  useEffect(() => {
    refreshSavedItems();
  }, []);

  const simulationMutation = useMutation({
    mutationFn: () =>
      getSimulationPrice({
        asset,
        date,
        amountUsd: numericAmount,
      }),
    onMutate: () => {
      setSaveMessage('');
      recordMetric({
        name: 'crypto.simulation.started',
        durationMs: 0,
        status: 'success',
        metadata: { asset, date },
      });
    },
    onSuccess: (result) => {
      setLatestResult(result);
      setLatestEventResult(null);
      recordMetric({
        name:
          result.status === 'success'
            ? 'crypto.simulation.completed'
            : 'crypto.simulation.failed',
        durationMs: 0,
        status: result.status === 'success' ? 'success' : 'error',
        metadata: { asset, date, resultStatus: result.status },
      });
    },
    onError: () => {
      recordMetric({
        name: 'crypto.simulation.failed',
        durationMs: 0,
        status: 'error',
        metadata: { asset, date, resultStatus: 'request_error' },
      });
    },
  });

  const eventScenarioMutation = useMutation({
    mutationFn: () => {
      if (!selectedEvent) throw new Error('Select an event before running a simulation.');
      return getSimulationEventScenario({
        eventId: selectedEvent.id,
        delay: selectedDelay,
        amountUsd: numericAmount,
      });
    },
    onMutate: () => {
      setSaveMessage('');
      recordMetric({
        name: 'crypto.simulation.started',
        durationMs: 0,
        status: 'success',
        metadata: { asset, mode: 'event', eventId: selectedEvent?.id ?? null, delay: selectedDelay },
      });
    },
    onSuccess: (result) => {
      setLatestResult(result);
      setLatestEventResult(result.status === 'success' ? result : null);
      recordMetric({
        name:
          result.status === 'success'
            ? 'crypto.simulation.completed'
            : 'crypto.simulation.failed',
        durationMs: 0,
        status: result.status === 'success' ? 'success' : 'error',
        metadata: {
          asset,
          mode: 'event',
          eventId: selectedEvent?.id ?? null,
          delay: selectedDelay,
          resultStatus: result.status,
        },
      });
    },
    onError: () => {
      recordMetric({
        name: 'crypto.simulation.failed',
        durationMs: 0,
        status: 'error',
        metadata: {
          asset,
          mode: 'event',
          eventId: selectedEvent?.id ?? null,
          delay: selectedDelay,
          resultStatus: 'request_error',
        },
      });
    },
  });

  const onSave = async () => {
    if (!isSuccessfulResult(latestResult)) return;

    const saved = await saveSimulationSnapshot({
      input: {
        asset,
        requestedDate: latestEventResult?.historical.resolvedDate ?? date,
        amountUsd: numericAmount,
        scenarioType: latestEventResult ? 'event' : 'date',
        event: latestEventResult
          ? {
              id: latestEventResult.event.id,
              headline: latestEventResult.event.headline,
              eventDate: latestEventResult.event.eventDate,
              delay: latestEventResult.input.delay,
            }
          : undefined,
      },
      result: latestResult,
    });

    recordMetric({
      name: 'crypto.simulation.saved',
      durationMs: 0,
      status: 'success',
      metadata: { asset: saved.input.asset, date: saved.input.requestedDate },
    });
    setSaveMessage('Saved simulation');
    await refreshSavedItems();
  };

  return (
    <ScrollView
      style={{ backgroundColor: Colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: headerHeight + 16 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Simulation</Text>
          <Text style={styles.subtitle}>
            Hypothetical simulation using historical and current USD prices
          </Text>
          <Text style={styles.trustText}>
            Historical dates: {MIN_SIMULATION_DATE} to {MAX_SIMULATION_DATE}
          </Text>
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.resultHeader}>
          <View>
            <Text style={styles.panelTitle}>Asset catalog</Text>
            <Text style={styles.helperText}>
              Not all catalog assets are enabled for Simulation v1.
            </Text>
          </View>
          {assetCatalogQuery.isLoading && <ActivityIndicator size="small" color={Colors.primary} />}
        </View>

        {assetCatalogQuery.isError && (
          <View style={styles.stateRow}>
            <Ionicons name="cloud-offline-outline" size={20} color="#C24135" />
            <Text style={styles.stateText}>Unable to load asset catalog.</Text>
          </View>
        )}

        {assetCatalog && (
          <>
            <View style={styles.catalogStatsRow}>
              <View style={styles.catalogStat}>
                <Text style={styles.resultLabel}>Ready assets</Text>
                <Text style={styles.resultValue}>{catalogReadyCount}</Text>
              </View>
              <View style={styles.catalogStat}>
                <Text style={styles.resultLabel}>Unavailable assets</Text>
                <Text style={styles.resultValue}>{catalogUnavailableCount}</Text>
              </View>
              <View style={styles.catalogStat}>
                <Text style={styles.resultLabel}>Market cache</Text>
                <Text style={styles.resultValue}>{assetCatalog.source.marketCacheStatus}</Text>
              </View>
            </View>

            {topCatalogAssets.length > 0 && (
              <View style={styles.catalogList}>
                {topCatalogAssets.map((item) => (
                  <View key={item.assetId} style={styles.catalogRow}>
                    <Text style={styles.catalogSymbol}>{item.symbol}</Text>
                    <Text style={styles.catalogName}>{item.name}</Text>
                    <Text style={styles.catalogMeta}>
                      {item.market.rank ? `#${item.market.rank}` : 'ready'}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {firstUnavailableAsset && (
              <Text style={styles.helperText}>
                {firstUnavailableAsset.symbol}: {firstUnavailableAsset.availability.reason}
              </Text>
            )}
          </>
        )}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Build a scenario</Text>

        <View style={styles.modeRow}>
          {(['date', 'event'] as const).map((item) => {
            const isSelected = mode === item;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.modeButton, isSelected && styles.modeButtonSelected]}
                onPress={() => selectMode(item)}
                activeOpacity={0.82}
              >
                <Text style={[styles.modeText, isSelected && styles.modeTextSelected]}>
                  {item === 'date' ? 'Date' : 'Event'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.assetRow}>
          {SIMULATION_ASSETS.map((item) => {
            const isSelected = item.symbol === asset;
            return (
              <TouchableOpacity
                key={item.symbol}
                style={[styles.assetButton, isSelected && styles.assetButtonSelected]}
                onPress={() => selectAsset(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.assetSymbol, isSelected && styles.assetTextSelected]}>
                  {item.symbol}
                </Text>
                <Text style={[styles.assetName, isSelected && styles.assetTextSelected]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {mode === 'event' && (
          <View style={styles.eventExplorer}>
            <View style={styles.resultHeader}>
              <View>
                <Text style={styles.trustHeading}>Market events</Text>
                <Text style={styles.helperText}>
                  Sourced headlines for normal users reacting after public news.
                </Text>
              </View>
              {eventsQuery.isLoading && <ActivityIndicator size="small" color={Colors.primary} />}
            </View>

            {eventsQuery.isError && (
              <View style={styles.stateRow}>
                <Ionicons name="refresh-outline" size={20} color="#C24135" />
                <Text style={styles.stateText}>Unable to load event headlines.</Text>
              </View>
            )}

            {eventsQuery.data?.status !== 'success' && eventsQuery.data && (
              <Text style={styles.stateText}>{eventsQuery.data.message}</Text>
            )}

            {eventList.map((event) => {
              const isSelected = event.id === selectedEvent?.id;
              return (
                <TouchableOpacity
                  key={event.id}
                  style={[styles.eventCard, isSelected && styles.eventCardSelected]}
                  onPress={() => setSelectedEventId(event.id)}
                  activeOpacity={0.84}
                >
                  <Text style={styles.eventHeadline}>{event.headline}</Text>
                  <Text style={styles.eventMeta}>
                    {event.eventDate} · {event.category.replace('_', ' ')}
                  </Text>
                  <Text style={styles.stateText}>{event.summary}</Text>
                  <Text style={styles.resultLabel}>Source: {event.sources.length} verified sources</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {mode === 'date' && (
        <View style={styles.marketExplorer}>
          <View style={styles.marketSummaryHeader}>
            <View>
              <Text style={styles.marketSummaryLabel}>Market Summary &gt; {selectedAsset.name}</Text>
              <Text style={styles.marketSummaryPrice}>
                {selectedPoint ? formatUsd(selectedPoint.priceUsd) : 'Loading price'}
              </Text>
              <Text
                style={[
                  styles.marketSummaryChange,
                  historyChangePercent >= 0 ? styles.gainTextPositive : styles.gainTextNegative,
                ]}
              >
                {formatPercent(historyChangePercent)} in {selectedYear}
              </Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.yearRow}>
              {simulationYears.map((year) => {
                const isSelected = selectedYear === year;
                return (
                  <TouchableOpacity
                    key={year}
                    style={[styles.yearButton, isSelected && styles.yearButtonSelected]}
                    onPress={() => setSelectedYear(year)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.yearText, isSelected && styles.yearTextSelected]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.chartShell}>
            {historyQuery.isLoading && (
              <View style={styles.chartState}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.helperText}>Loading historical prices</Text>
              </View>
            )}

            {historyQuery.isError && (
              <View style={styles.chartState}>
                <Text style={styles.stateText}>Unable to load historical chart data.</Text>
                <TouchableOpacity style={styles.inlineRetryButton} onPress={() => historyQuery.refetch()}>
                  <Text style={styles.inlineRetryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {historyQuery.data?.status !== 'success' && historyQuery.data && (
              <View style={styles.chartState}>
                <Text style={styles.stateText}>{historyQuery.data.message}</Text>
              </View>
            )}

            {chartData.length > 1 && (
              <CartesianChart
                chartPressState={chartPressState}
                data={chartData}
                xKey="timestamp"
                yKeys={['price']}
                axisOptions={{
                  font: chartFont,
                  tickCount: 4,
                  labelColor: Colors.gray,
                  lineColor: '#D5DAE2',
                  formatYLabel: (value) => formatAxisUsdLabel(Number(value)),
                  formatXLabel: (value) => monthLabel(new Date(Number(value)).toISOString().slice(0, 10)),
                }}
              >
                {({ points }: any) => (
                  <>
                    <Line points={points.price} color="#F2827F" strokeWidth={3} />
                    {isChartPressActive && (
                      <ChartToolTip
                        x={chartPressState.x.position}
                        y={chartPressState.y.price.position}
                      />
                    )}
                  </>
                )}
              </CartesianChart>
            )}
          </View>

          <Text style={styles.helperText}>
            Select a date by pressing and dragging across the chart, or jump by month below.
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.monthRow}>
              {monthPoints.map((point) => {
                const isSelected = point.date === date;
                return (
                  <TouchableOpacity
                    key={point.date}
                    style={[styles.monthButton, isSelected && styles.monthButtonSelected]}
                    onPress={() => setDate(point.date)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.monthText, isSelected && styles.monthTextSelected]}>
                      {monthLabel(point.date)}
                    </Text>
                    <Text style={[styles.monthPrice, isSelected && styles.monthTextSelected]}>
                      {formatCompactUsd(point.priceUsd)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
        )}

        {mode === 'event' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Reaction delay</Text>
            <View style={styles.delayRow}>
              {EVENT_DELAYS.map((delay) => {
                const isSelected = selectedDelay === delay.value;
                return (
                  <TouchableOpacity
                    key={delay.value}
                    style={[styles.delayButton, isSelected && styles.delayButtonSelected]}
                    onPress={() => setSelectedDelay(delay.value)}
                    activeOpacity={0.82}
                  >
                    <Text style={[styles.delayText, isSelected && styles.delayTextSelected]}>
                      {delay.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {mode === 'date' && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Buy date</Text>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            keyboardType="numbers-and-punctuation"
            style={styles.input}
          />
          <Text style={styles.helperText}>
            Use a date from {MIN_SIMULATION_DATE} through {MAX_SIMULATION_DATE}.
          </Text>
        </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount (USD)</Text>
          <TextInput
            value={amountUsd}
            onChangeText={setAmountUsd}
            placeholder="100"
            keyboardType="decimal-pad"
            style={styles.input}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            !(mode === 'date' ? canRunSimulation : canRunEventSimulation) &&
              styles.primaryButtonDisabled,
          ]}
          onPress={() =>
            mode === 'date' ? simulationMutation.mutate() : eventScenarioMutation.mutate()
          }
          disabled={
            mode === 'date'
              ? !canRunSimulation || simulationMutation.isPending
              : !canRunEventSimulation || eventScenarioMutation.isPending
          }
          activeOpacity={0.82}
        >
          {simulationMutation.isPending || eventScenarioMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="calculator-outline" size={18} color="#fff" />
              <Text style={styles.primaryButtonText}>
                {mode === 'date' ? 'Run simulation' : 'Run event simulation'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {simulationMutation.isError && (
        <View style={styles.panel}>
          <View style={styles.stateRow}>
            <Ionicons name="cloud-offline-outline" size={22} color="#C24135" />
            <Text style={styles.stateText}>Unable to reach the simulation API.</Text>
          </View>
        </View>
      )}

      {eventScenarioMutation.isError && (
        <View style={styles.panel}>
          <View style={styles.stateRow}>
            <Ionicons name="cloud-offline-outline" size={22} color="#C24135" />
            <Text style={styles.stateText}>Unable to reach the event simulation API.</Text>
          </View>
        </View>
      )}

      {latestResult?.status === 'error' && (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Check the inputs</Text>
          <Text style={styles.stateText}>{latestResult.message}</Text>
        </View>
      )}

      {latestResult?.status === 'unavailable' && (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Price unavailable</Text>
          <Text style={styles.stateText}>{latestResult.message}</Text>
        </View>
      )}

      {successfulResult && (
        <View style={styles.panel}>
          <View style={styles.resultHeader}>
            <View>
              <Text style={styles.panelTitle}>Hypothetical simulation</Text>
              <Text style={styles.subtitle}>
                {latestEventResult
                  ? `${selectedAsset.name} after ${latestEventResult.event.headline}`
                  : `${selectedAsset.name} from ${successfulResult.historical.resolvedDate}`}
              </Text>
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={onSave} activeOpacity={0.82}>
              <Ionicons name="bookmark-outline" size={16} color={Colors.primary} />
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.resultGrid}>
            <View style={styles.resultCell}>
              <Text style={styles.resultLabel}>Historical price</Text>
              <Text style={styles.resultValue}>{formatUsd(successfulResult.historical.priceUsd)}</Text>
            </View>
            <View style={styles.resultCell}>
              <Text style={styles.resultLabel}>Current price</Text>
              <Text style={styles.resultValue}>{formatUsd(successfulResult.current.priceUsd)}</Text>
            </View>
            <View style={styles.resultCell}>
              <Text style={styles.resultLabel}>Estimated quantity</Text>
              <Text style={styles.resultValue}>
                {successfulResult.result.impliedQuantity.toFixed(8)}
              </Text>
            </View>
            <View style={styles.resultCell}>
              <Text style={styles.resultLabel}>Current value</Text>
              <Text style={styles.resultValue}>
                {formatUsd(successfulResult.result.currentValueUsd)}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.gainRow,
              successfulResult.result.gainLossUsd >= 0 ? styles.gainPositive : styles.gainNegative,
            ]}
          >
            <Ionicons
              name={successfulResult.result.gainLossUsd >= 0 ? 'trending-up' : 'trending-down'}
              size={20}
              color={successfulResult.result.gainLossUsd >= 0 ? '#0A8F5A' : '#C24135'}
            />
            <Text
              style={[
                styles.gainText,
                successfulResult.result.gainLossUsd >= 0
                  ? styles.gainTextPositive
                  : styles.gainTextNegative,
              ]}
            >
              {formatUsd(successfulResult.result.gainLossUsd)} ({formatPercent(
                successfulResult.result.gainLossPercent
              )})
            </Text>
          </View>

          {successfulResult.historical.dateResolution === 'next_available' && (
            <Text style={styles.helperText}>
              Requested {successfulResult.historical.requestedDate}; using next available date{' '}
              {successfulResult.historical.resolvedDate}.
            </Text>
          )}

          {latestEventResult && (
            <View style={styles.riskBlock}>
              <View>
                <Text style={styles.trustHeading}>Risk journey</Text>
                <Text style={styles.helperText}>{latestEventResult.takeaway}</Text>
              </View>
              <View style={styles.resultGrid}>
                <View style={styles.resultCell}>
                  <Text style={styles.resultLabel}>Max drawdown</Text>
                  <Text style={styles.resultValue}>
                    {formatPercent(latestEventResult.risk.maxDrawdownPercent)}
                  </Text>
                </View>
                <View style={styles.resultCell}>
                  <Text style={styles.resultLabel}>Longest below start</Text>
                  <Text style={styles.resultValue}>
                    {latestEventResult.risk.longestUnderwaterDays} days
                  </Text>
                </View>
                <View style={styles.resultCell}>
                  <Text style={styles.resultLabel}>Best 30 days</Text>
                  <Text style={styles.resultValue}>
                    {formatPercent(latestEventResult.risk.bestThirtyDayReturnPercent)}
                  </Text>
                </View>
                <View style={styles.resultCell}>
                  <Text style={styles.resultLabel}>Worst 30 days</Text>
                  <Text style={styles.resultValue}>
                    {formatPercent(latestEventResult.risk.worstThirtyDayReturnPercent)}
                  </Text>
                </View>
              </View>
              <Text style={styles.trustText}>
                Source: {latestEventResult.event.sources.length} verified event sources · Reaction:{' '}
                {EVENT_DELAYS.find((delay) => delay.value === latestEventResult.input.delay)?.label}
              </Text>
            </View>
          )}

          <View style={styles.comparisonBlock}>
            <View>
              <Text style={styles.trustHeading}>Purchasing power</Text>
              <Text style={styles.helperText}>
                Compare the current value with everyday costs by city.
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.cityRow}>
                {PURCHASING_POWER_CITIES.map((city) => {
                  const isSelected = city.id === selectedCity;
                  return (
                    <TouchableOpacity
                      key={city.id}
                      style={[styles.cityButton, isSelected && styles.cityButtonSelected]}
                      onPress={() => setSelectedCity(city.id)}
                      activeOpacity={0.82}
                    >
                      <Text style={[styles.cityText, isSelected && styles.cityTextSelected]}>
                        {city.shortName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {purchasingPowerQuery.isLoading && (
              <View style={styles.stateRow}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.stateText}>Loading city comparisons.</Text>
              </View>
            )}

            {purchasingPowerQuery.isError && (
              <View style={styles.stateRow}>
                <Ionicons name="refresh-outline" size={20} color="#C24135" />
                <Text style={styles.stateText}>Unable to load city comparisons.</Text>
              </View>
            )}

            {purchasingPowerQuery.data?.status === 'error' && (
              <Text style={styles.stateText}>{purchasingPowerQuery.data.message}</Text>
            )}

            {purchasingPower && (
              <>
                <View style={styles.comparisonSection}>
                  <Text style={styles.comparisonSectionTitle}>Monthly essentials</Text>
                  <ComparisonRows items={purchasingPower.comparisons.monthlyEssentials} />
                </View>
                <View style={styles.comparisonSection}>
                  <Text style={styles.comparisonSectionTitle}>Big purchases</Text>
                  <ComparisonRows items={purchasingPower.comparisons.bigPurchases} />
                </View>
                <Text style={styles.trustText}>
                  Data estimate: {purchasingPower.source.provider},{' '}
                  {purchasingPower.source.datasetVersion}
                </Text>
              </>
            )}
          </View>

          <View style={styles.trustBlock}>
            <Text style={styles.trustHeading}>Data source</Text>
            <Text style={styles.trustText}>
              Historical: {successfulResult.historical.source.provider}
            </Text>
            <Text style={styles.trustText}>Current: {successfulResult.current.source.provider}</Text>
            <Text style={styles.trustText}>
              Current cache: {successfulResult.current.cache.status}, {successfulResult.current.cache.ttlSeconds}s
            </Text>
          </View>

          {!!saveMessage && <Text style={styles.saveMessage}>{saveMessage}</Text>}
        </View>
      )}

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Saved simulations</Text>
        {savedItems.length === 0 ? (
          <Text style={styles.stateText}>Saved simulations will appear here.</Text>
        ) : (
          savedItems.map((item) => (
            <View key={item.id} style={styles.savedRow}>
              <View>
                <Text style={styles.savedTitle}>
                  {item.input.asset} · {formatUsd(item.input.amountUsd)}
                </Text>
                <Text style={styles.savedMeta}>
                  {item.input.scenarioType === 'event' && item.input.event
                    ? `${item.hypotheticalLabel} · Event · ${item.input.event.headline}`
                    : `${item.hypotheticalLabel} · ${item.input.requestedDate}`}
                </Text>
              </View>
              <Text style={styles.savedValue}>
                {formatUsd(item.resultSnapshot.result.currentValueUsd)}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 140,
  },
  headerRow: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  headerCopy: {
    gap: 4,
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
  panel: {
    ...defaultStyles.block,
    borderRadius: 16,
    marginBottom: 14,
    gap: 14,
  },
  panelTitle: {
    color: Colors.dark,
    fontSize: 18,
    fontWeight: '800',
  },
  modeRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 12,
    padding: 3,
    backgroundColor: '#FAFBFD',
  },
  modeButton: {
    flex: 1,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonSelected: {
    backgroundColor: Colors.primary,
  },
  modeText: {
    color: Colors.gray,
    fontSize: 13,
    fontWeight: '900',
  },
  modeTextSelected: {
    color: '#fff',
  },
  assetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  eventExplorer: {
    borderWidth: 1,
    borderColor: '#E2E6EE',
    borderRadius: 16,
    padding: 12,
    gap: 10,
    backgroundColor: '#FAFBFD',
  },
  eventCard: {
    borderWidth: 1,
    borderColor: '#E8ECF2',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    backgroundColor: '#fff',
  },
  eventCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#EEF2FF',
  },
  eventHeadline: {
    color: Colors.dark,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
  eventMeta: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  delayRow: {
    flexDirection: 'row',
    gap: 8,
  },
  delayButton: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  delayButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#EEF2FF',
  },
  delayText: {
    color: Colors.gray,
    fontSize: 12,
    fontWeight: '900',
  },
  delayTextSelected: {
    color: Colors.primary,
  },
  marketExplorer: {
    borderWidth: 1,
    borderColor: '#E2E6EE',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    backgroundColor: '#FAFBFD',
  },
  marketSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  marketSummaryLabel: {
    color: Colors.gray,
    fontSize: 13,
    fontWeight: '800',
  },
  marketSummaryPrice: {
    color: Colors.dark,
    fontSize: 30,
    fontWeight: '900',
    marginTop: 4,
  },
  marketSummaryChange: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 4,
  },
  yearRow: {
    flexDirection: 'row',
    gap: 8,
  },
  yearButton: {
    height: 34,
    minWidth: 62,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  yearButtonSelected: {
    backgroundColor: '#EAF1FF',
    borderColor: Colors.primary,
  },
  yearText: {
    color: Colors.gray,
    fontSize: 13,
    fontWeight: '900',
  },
  yearTextSelected: {
    color: Colors.primary,
  },
  chartShell: {
    height: 210,
    borderRadius: 12,
    overflow: 'hidden',
  },
  chartState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  inlineRetryButton: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
  },
  inlineRetryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  monthRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 2,
  },
  monthButton: {
    minWidth: 72,
    minHeight: 52,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 12,
    padding: 8,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  monthButtonSelected: {
    borderColor: '#F2827F',
    backgroundColor: '#FFF1F0',
  },
  monthText: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '900',
  },
  monthPrice: {
    color: Colors.gray,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
  },
  monthTextSelected: {
    color: '#C24135',
  },
  assetButton: {
    flex: 1,
    minHeight: 62,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 14,
    padding: 10,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  assetButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#EEF2FF',
  },
  assetSymbol: {
    color: Colors.dark,
    fontWeight: '900',
    fontSize: 15,
  },
  assetName: {
    color: Colors.gray,
    fontWeight: '700',
    fontSize: 11,
    marginTop: 3,
  },
  assetTextSelected: {
    color: Colors.primary,
  },
  inputGroup: {
    gap: 7,
  },
  label: {
    color: Colors.dark,
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 12,
    color: Colors.dark,
    fontSize: 16,
    fontWeight: '700',
    backgroundColor: '#fff',
  },
  helperText: {
    color: Colors.gray,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  primaryButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stateText: {
    color: Colors.gray,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  saveButton: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  saveButtonText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  resultGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  resultCell: {
    width: '48%',
    minHeight: 74,
    borderWidth: 1,
    borderColor: '#E8ECF2',
    borderRadius: 12,
    padding: 10,
    justifyContent: 'center',
  },
  resultLabel: {
    color: Colors.gray,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
  },
  resultValue: {
    color: Colors.dark,
    fontSize: 15,
    fontWeight: '900',
  },
  catalogStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  catalogStat: {
    flex: 1,
    minHeight: 66,
    borderWidth: 1,
    borderColor: '#E8ECF2',
    borderRadius: 12,
    padding: 9,
    justifyContent: 'center',
  },
  catalogList: {
    gap: 8,
  },
  catalogRow: {
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: '#FAFBFD',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catalogSymbol: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '900',
    width: 48,
  },
  catalogName: {
    flex: 1,
    color: Colors.dark,
    fontSize: 13,
    fontWeight: '800',
  },
  catalogMeta: {
    color: Colors.gray,
    fontSize: 12,
    fontWeight: '800',
  },
  gainRow: {
    minHeight: 46,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gainPositive: {
    backgroundColor: '#E8F7EF',
  },
  gainNegative: {
    backgroundColor: '#FDECEC',
  },
  gainText: {
    fontSize: 15,
    fontWeight: '900',
  },
  gainTextPositive: {
    color: '#0A8F5A',
  },
  gainTextNegative: {
    color: '#C24135',
  },
  trustBlock: {
    paddingTop: 4,
  },
  trustHeading: {
    color: Colors.dark,
    fontSize: 13,
    fontWeight: '900',
  },
  comparisonBlock: {
    borderWidth: 1,
    borderColor: '#E8ECF2',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  riskBlock: {
    borderWidth: 1,
    borderColor: '#E8ECF2',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    backgroundColor: '#FAFBFD',
  },
  cityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cityButton: {
    height: 34,
    paddingHorizontal: 13,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  cityButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#EEF2FF',
  },
  cityText: {
    color: Colors.gray,
    fontSize: 12,
    fontWeight: '900',
  },
  cityTextSelected: {
    color: Colors.primary,
  },
  comparisonSection: {
    gap: 8,
  },
  comparisonSectionTitle: {
    color: Colors.dark,
    fontSize: 13,
    fontWeight: '900',
  },
  comparisonList: {
    gap: 8,
  },
  comparisonRow: {
    minHeight: 54,
    borderRadius: 10,
    backgroundColor: '#FAFBFD',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  comparisonCopy: {
    flex: 1,
  },
  comparisonTitle: {
    color: Colors.dark,
    fontSize: 13,
    fontWeight: '900',
  },
  comparisonMeta: {
    color: Colors.gray,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  comparisonQuantity: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  saveMessage: {
    color: '#0A8F5A',
    fontSize: 13,
    fontWeight: '800',
  },
  savedRow: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: '#E8ECF2',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  savedTitle: {
    color: Colors.dark,
    fontSize: 14,
    fontWeight: '900',
  },
  savedMeta: {
    color: Colors.gray,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  savedValue: {
    color: Colors.dark,
    fontSize: 14,
    fontWeight: '900',
  },
});
