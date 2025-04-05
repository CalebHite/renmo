"use client"

import type React from "react"

import { useState } from "react"
import { useXRPL } from "../hooks/useXRPL"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle } from "lucide-react"

export default function SendPayment() {
  const { sendPayment, walletAddress } = useXRPL()
  const [destination, setDestination] = useState("")
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsLoading(true)

    try {
      if (!destination || !amount) {
        throw new Error("Please fill in all fields")
      }

      await sendPayment(destination, amount)
      setSuccess(true)
      setDestination("")
      setAmount("")
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="destination">Destination Address</Label>
          <Input
            id="destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Enter XRPL address"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount (RLUSD)</Label>
          <Input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            step="0.000001"
            min="0.000001"
          />
        </div>

        <Card className="bg-slate-50 border-none">
          <CardContent className="pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Transaction Details</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount to send:</span>
                <span>{amount || "0"} RLUSD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction fee:</span>
                <span>0.00001 RLUSD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account reserve:</span>
                <span>10 RLUSD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Trust line reserve:</span>
                <span>2 RLUSD</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-gray-700">Total cost:</span>
                <span>{amount ? (Number(amount) + 12.00001).toFixed(6) : "0"} RLUSD</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Note: The account reserve (10 RLUSD) and trust line reserve (2 RLUSD) are held by the network and can be
              recovered if the account is closed.
            </p>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="bg-red-50 text-red-800 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>Payment sent successfully!</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={isLoading} className="w-48 bg-[#008CFF] hover:bg-[#0070CC] rounded-lg cursor-pointer" style={{ padding: "1rem" }}>
          {isLoading ? "Sending..." : "Send Payment"}
        </Button>
      </form>

      {walletAddress && (
        <Card className="mt-4 bg-slate-50 border-none">
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">Your address:</p>
            <p className="font-mono text-sm break-all">{walletAddress}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

