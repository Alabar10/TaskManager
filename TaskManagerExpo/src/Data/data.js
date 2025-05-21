import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
  strokeWidth: 2,
  decimalPlaces: 0,
};

const DataScreen = () => {
  const [monthlyData, setMonthlyData] = useState([]);
  const [timeTakenData, setTimeTakenData] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = 2;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const monthlyRes = await fetch(`http://192.168.1.41:5050/api/data/monthly_stats/${userId}`);
        const monthlyJson = await monthlyRes.json();
        setMonthlyData(monthlyJson);

        const timeTakenRes = await fetch(`http://192.168.1.41:5050/api/data/time_taken_stats/${userId}`);
        const timeTakenJson = await timeTakenRes.json();
        setTimeTakenData(timeTakenJson);

      } catch (error) {
        console.error("❌ Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Task Completion Breakdown</Text>
      <Image
        source={{ uri: `http://192.168.1.41:5050/api/data/completion_rate_chart` }}
        style={styles.chartImage}
        resizeMode="contain"
      />

      <Text style={styles.title}>Monthly Task Stats</Text>
      {loading ? <ActivityIndicator /> : (
        monthlyData.length > 0 ? (
          <BarChart
            data={{
              labels: monthlyData.map(d => d.month),
              datasets: [{ data: monthlyData.map(d => d.completed_tasks) }]
            }}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
          />
        ) : <Text style={styles.noData}>No data</Text>
      )}

      <Text style={styles.title}>Average Completion Time</Text>
      {loading ? <ActivityIndicator /> : (
        timeTakenData.length > 0 ? (
          <LineChart
            data={{
              labels: timeTakenData.map(d => d.category),
              datasets: [{ data: timeTakenData.map(d => d.avg_minutes) }]
            }}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
          />
        ) : <Text style={styles.noData}>No data</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16 },
  title: { fontSize: 18, fontWeight: 'bold', marginVertical: 16, textAlign: 'center' },
  chartImage: { width: '100%', height: 300, marginBottom: 10 },
  chart: { marginVertical: 8, borderRadius: 10 },
  noData: { textAlign: 'center', color: 'gray', marginBottom: 20 }
});

export default DataScreen;
