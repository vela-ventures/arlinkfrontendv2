'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function Changelog() {
  const changelogEntries = [
    {
      date: "May 2023",
      entries: [
        {
          title: "Improved Dashboard Performance",
          description: "Significantly enhanced the loading speed and overall performance of the main dashboard.",
          type: "improvement"
        },
        {
          title: "New API Endpoints",
          description: "Added new API endpoints for better integration with third-party services.",
          type: "new-feature"
        },
        {
          title: "Bug Fix: User Authentication",
          description: "Resolved an issue where some users were experiencing login problems.",
          type: "bug-fix"
        }
      ]
    },
    {
      date: "April 2023",
      entries: [
        {
          title: "Introduced Dark Mode",
          description: "Added a new dark mode option for improved visibility in low-light environments.",
          type: "new-feature"
        },
        {
          title: "Updated Documentation",
          description: "Comprehensive update to our documentation, including new guides and examples.",
          type: "improvement"
        }
      ]
    },
    // Add more months and entries as needed
  ]

  return (
    <div className="bg-neutral-900">
      <header className="bg-neutral-800 border-b border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-white">Changelog</h1>
            <div className="w-full max-w-xs">
              <Input 
                type="search" 
                placeholder="Search updates..." 
                className="w-full bg-neutral-700 text-white placeholder-neutral-400 border-neutral-600" 
              />
            </div>
          </div>
        </div>
      </header>
      <main className="bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {changelogEntries.map((monthEntry, index) => (
              <div key={index}>
                <h2 className="text-lg font-semibold text-white mb-4">{monthEntry.date}</h2>
                <div className="space-y-4">
                  {monthEntry.entries.map((entry, entryIndex) => (
                    <Card key={entryIndex} className="bg-neutral-800 border-neutral-700">
                      <CardHeader>
                        <CardTitle className="text-xl text-white">{entry.title}</CardTitle>
                        <CardDescription>
                          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                            entry.type === 'new-feature' ? 'bg-blue-900 text-blue-200' :
                            entry.type === 'improvement' ? 'bg-green-900 text-green-200' :
                            'bg-red-900 text-red-200'
                          }`}>
                            {entry.type === 'new-feature' ? 'New Feature' :
                             entry.type === 'improvement' ? 'Improvement' :
                             'Bug Fix'}
                          </span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-neutral-300">{entry.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
