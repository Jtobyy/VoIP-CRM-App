import { BarChart, LineChart, PieChart, PopulationPyramid, RadarChart } from "react-native-gifted-charts";

// ...
import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const TestBarChat = () => {
    const data=[ {value:50}, {value:80}, {value:90}, {value:70} ]
  return (
    <View>
<BarChart data = {data} />
    </View>
  )
}

export default TestBarChat

const styles = StyleSheet.create({})