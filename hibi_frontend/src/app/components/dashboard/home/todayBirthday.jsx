"use client"
import { Card, CardContent } from '@/components/ui/card'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const TodayBirthday = () => {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <Card className="w-full h-[80px] bg-gradient-to-br from-green-50 to-emerald-50 dark:from-emerald-900/30 dark:to-green-900/30 border-0 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden group relative">
      {/* Animated background elements */}
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-md group-hover:blur-lg transition-all duration-700"></div>
      <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-gradient-to-r from-lime-500/20 to-teal-500/20 blur-md group-hover:blur-lg transition-all duration-700"></div>
      
      <CardContent className="p-5 h-full flex flex-col justify-between relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-semibold text-green-600 dark:text-green-300 uppercase tracking-wider">
              Happy Birthday 🎉
            </h3>
            <h3 className="text-sm font-semibold text-green-600 dark:text-green-300 uppercase tracking-wider">
              Uday Jaya Santhosh
            </h3>
          </div>
          <motion.div 
            className="w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center shadow-lg"
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <span className="text-2xl">🎂</span>
          </motion.div>
        </div>
        
        {/* <div className="flex justify-between items-center mt-3">
          <div className="flex space-x-1">
            {[..."🎁🎈🎉🥳"].map((emoji, i) => (
              <motion.span 
                key={i}
                className="text-sm opacity-90"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              >
                {emoji}
              </motion.span>
            ))}
          </div>
        </div> */}
      </CardContent>
    </Card>
  )
}

export default TodayBirthday;