'use client'

import { useState } from 'react'

export default function Home() {
  const [metrics] = useState({
    winRate: 73,
    activePositions: 8,
    averageDailyEdge: 14.3,
    sevenDayReturn: 187
  })

  const [tradeTimes] = useState(['11:00', '15:00', '21:00'])

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">MIYOMI</h1>
          <p className="text-xl text-gray-300 mb-1">Contrarian Market Oracle</p>
          <p className="text-gray-400">NYC-based AI trader focused on market inefficiencies</p>
        </header>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="text-center">
            <h3 className="text-gray-400 text-sm mb-1">Win Rate</h3>
            <p className="text-2xl font-bold">{metrics.winRate}%</p>
          </div>
          
          <div className="text-center">
            <h3 className="text-gray-400 text-sm mb-1">Active Positions</h3>
            <p className="text-2xl font-bold">{metrics.activePositions}</p>
          </div>
          
          <div className="text-center">
            <h3 className="text-gray-400 text-sm mb-1">Average Daily Edge</h3>
            <p className="text-2xl font-bold">{metrics.averageDailyEdge}%</p>
          </div>
          
          <div className="text-center">
            <h3 className="text-gray-400 text-sm mb-1">7-Day Return</h3>
            <p className="text-2xl font-bold text-green-400">+{metrics.sevenDayReturn}%</p>
          </div>
        </div>

        {/* Trading Schedule */}
        <div className="bg-gray-900 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold mb-4">🕐 Trade Drops</h3>
          <p className="text-gray-300 mb-2">Daily at:</p>
          <div className="flex gap-4">
            {tradeTimes.map((time) => (
              <span key={time} className="bg-gray-800 px-3 py-1 rounded text-sm">
                {time} ET
              </span>
            ))}
          </div>
        </div>

        {/* Subscription Info */}
        <div className="bg-gray-900 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold mb-4">💰 Subscription</h3>
          <p className="text-2xl font-bold mb-2">$5/month</p>
          <p className="text-gray-400 text-sm">with free preview option</p>
        </div>

        {/* Recent Picks Section */}
        <div className="bg-gray-900 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold mb-4">📊 Recent Picks</h3>
          <p className="text-gray-400 text-sm">View latest predictions and performance data</p>
        </div>

        {/* Social Links */}
        <div className="flex justify-center gap-6 mb-8">
          <a 
            href="#" 
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Twitter
          </a>
          <a 
            href="#" 
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            YouTube
          </a>
        </div>

        {/* Navigation Links */}
        <div className="flex justify-center gap-6 mb-8 text-sm">
          <a href="/academy" className="text-gray-400 hover:text-white transition-colors">
            Academy
          </a>
          <a href="/agent" className="text-gray-400 hover:text-white transition-colors">
            Agent
          </a>
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm">
          © 2025 MIYOMI
        </footer>
      </div>
    </div>
  )
}
