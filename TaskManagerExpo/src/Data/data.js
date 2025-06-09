import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import config from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PieChart } from 'react-native-chart-kit';
import { RefreshControl } from 'react-native';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundGradientFrom: '#f8f9fa',
  backgroundGradientTo: '#f8f9fa',
  color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
  strokeWidth: 2,
  decimalPlaces: 0,
  barPercentage: 0.5,
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#2c3e50'
  },
  fillShadowGradient: '#3498db',
  fillShadowGradientOpacity: 0.3,
  propsForBackgroundLines: {
    strokeWidth: 0.5,
    stroke: 'rgba(0,0,0,0.1)'
  },
  propsForLabels: {
    fontSize: 12,
    fontFamily: 'Arial'
  }
};

const DataScreen = () => {
  const [monthlyData, setMonthlyData] = useState([]);
  const [timeTakenData, setTimeTakenData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [onTimeStats, setOnTimeStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (id) => {
    try {
      const monthlyRes = await fetch(`${config.API_URL}/api/data/monthly_stats/${id}`);
      const monthlyJson = await monthlyRes.json();
      setMonthlyData(monthlyJson);

      const timeTakenRes = await fetch(`${config.API_URL}/api/data/time_taken_stats/${id}`);
      const timeTakenJson = await timeTakenRes.json();
      setTimeTakenData(timeTakenJson);

      const onTimeRes = await fetch(`${config.API_URL}/api/data/on_time_stats/${id}`);
      const onTimeJson = await onTimeRes.json();
      setOnTimeStats(onTimeJson);
    } catch (error) {
      console.error("❌ Failed to fetch data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const id = await AsyncStorage.getItem("userId");
        if (id) {
          setUserId(id);
          setLoading(true);
          await fetchData(id);
        }
      } catch (err) {
        console.error("❌ Failed to load user ID:", err);
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleRefresh = async () => {
    if (!userId) return;
    setRefreshing(true);
    await fetchData(userId);
  };



  return (
    !userId ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    ) : (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
  }>
        <View style={styles.header}>
          <Text style={styles.headerText}>Your Productivity Analytics</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Task Completion Breakdown</Text>
          <Image
            source={{ uri: `${config.API_URL}/api/data/completion_rate_chart?user_id=${userId}` }}
            style={styles.chartImage}
            resizeMode="contain"
          />
        </View>
  
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Monthly Task Stats</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#3498db" />
            </View>
          ) : (
            monthlyData.length > 0 ? (
              <BarChart
                data={{
                  labels: monthlyData.map(d => d.month),
                  datasets: [{
                    data: monthlyData.map(d => d.completed_tasks),
                    color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`, // optional single color
                  }]
                  
                }}
                width={screenWidth - 40}
                height={240}
                chartConfig={chartConfig}
                style={styles.chart}
                fromZero
                showBarTops
                withInnerLines={false}
                withHorizontalLabels={true}
                withVerticalLabels={true}
                yAxisLabel=""
                yAxisSuffix=""
              />
            ) : <Text style={styles.noData}>No monthly data available</Text>
          )}
        </View>
  
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Average Completion Time (minutes)</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#3498db" />
            </View>
          ) : (
            timeTakenData.length > 0 ? (
              <LineChart
                data={{
                  labels: timeTakenData.map(d => d.category),
                  datasets: [{ 
                    data: timeTakenData.map(d => d.avg_minutes),
                    color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`,
                    strokeWidth: 3
                  }]
                }}
                width={screenWidth - 40}
                height={240}
                chartConfig={chartConfig}
                style={styles.chart}
                bezier
                withDots={true}
                withShadow={true}
                withInnerLines={true}
                withOuterLines={true}
                withVerticalLines={true}
                withHorizontalLines={true}
                fromZero
              />
            ) : <Text style={styles.noData}>No time tracking data available</Text>
          )}
        </View>

        <View style={styles.card}>
            <Text style={styles.cardTitle}>On-Time vs Late Tasks</Text>
            {loading || !onTimeStats ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#3498db" />
              </View>
            ) : (
              (onTimeStats.on_time + onTimeStats.late > 0) ? (
                <PieChart
                  data={[
                    {
                      name: 'On Time',
                      population: onTimeStats.on_time,
                      color: '#2ecc71',
                      legendFontColor: '#2c3e50',
                      legendFontSize: 14
                    },
                    {
                      name: 'Late',
                      population: onTimeStats.late,
                      color: '#e74c3c',
                      legendFontColor: '#2c3e50',
                      legendFontSize: 14
                    }
                  ]}
                  width={screenWidth - 40}
                  height={240}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              ) : (
                <Text style={styles.noData}>No timing data available</Text>
              )
            )}
          </View>
      </ScrollView>
    )
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  header: {
    backgroundColor: '#3498db',
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5
  },
  headerText: {
    fontSize: 22,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center'
  },
  chartImage: {
    width: '100%',
    height: 280,
    borderRadius: 8
  },
  chart: {
    borderRadius: 12,
    paddingRight: 20,
    marginTop: 10
  },
  noData: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: 16,
    paddingVertical: 30,
    fontStyle: 'italic'
  }
});

export default DataScreen;