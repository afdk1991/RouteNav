import { Component, ReactNode } from 'react'
import { useLaunchOptions } from '@tarojs/taro'
import './app.css'

class App extends Component<{ children?: ReactNode }> {
  componentDidMount() {
    // 初始化
    console.log('App mounted')
  }

  componentDidShow() {
    console.log('App show')
  }

  componentDidHide() {
    console.log('App hide')
  }

  render() {
    return this.props.children
  }
}

export default App
