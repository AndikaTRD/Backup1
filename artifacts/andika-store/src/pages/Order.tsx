import { Layout } from "@/components/layout";
import { useGetOrder, useUploadPaymentProof, getGetOrderQueryKey } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, QrCode, Upload, CheckCircle2, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

export default function Order() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading } = useGetOrder(orderId, { query: { enabled: !!orderId } });
  const uploadProof = useUploadPaymentProof();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (isLoading) return <Layout><div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
  if (!order) return <Layout><div className="text-center py-20 text-muted-foreground">Order not found</div></Layout>;

  const copyOrderId = () => {
    navigator.clipboard.writeText(order.orderId);
    toast({ title: "Copied!", description: "Order ID copied to clipboard." });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // remove data:image/...;base64, part if needed, but usually we just send the whole thing
      uploadProof.mutate(
        { orderId: order.orderId, data: { imageBase64: base64String, fileName: file.name } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(order.orderId) });
            toast({ title: "Success", description: "Payment proof uploaded successfully. Please wait for approval." });
          },
          onError: () => {
            toast({ title: "Upload Failed", description: "Could not upload payment proof.", variant: "destructive" });
          },
          onSettled: () => setIsUploading(false)
        }
      );
    };
    reader.readAsDataURL(file);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card neon-border rounded-2xl p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Status badge */}
          <div className="absolute top-0 right-0 p-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
              order.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
              order.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {order.status}
            </span>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold text-muted-foreground mb-2">Order Successfully Placed</h1>
            <div className="flex items-center justify-center gap-4 mt-4">
              <span className="text-4xl font-black text-white neon-text tracking-wider">{order.orderId}</span>
              <Button variant="ghost" size="icon" onClick={copyOrderId} className="text-muted-foreground hover:text-white">
                <Copy className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Please save this Order ID for reference.</p>
          </div>

          <div className="h-px w-full bg-border my-8" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-lg font-bold text-white mb-4">Payment Instructions</h2>
              
              {order.paymentMethod === 'QRIS' ? (
                <div className="bg-background border border-primary/30 p-6 rounded-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                  <img
                    src="/qris.jpeg"
                    alt="QRIS ANDIKATRD STORE"
                    className="w-full max-w-xs rounded-xl shadow-lg mb-4"
                  />
                  <h1 className="text-4xl font-black text-red-500 mb-4">
                    TEST BERHASIL
                  </h1>

                  <p className="font-bold text-yellow-400 text-xl">
                    QRIS BARU
                  </p>
                  <p className="text-lg font-bold text-primary mt-2">
                    {order.total.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-background p-4 rounded-xl border border-border">
                    <p className="font-bold text-white mb-1">BCA</p>
                    <p className="text-2xl font-mono text-primary tracking-widest">1234567890</p>
                    <p className="text-sm text-muted-foreground">a.n ANDIKA STORE</p>
                  </div>
                  <div className="bg-background p-4 rounded-xl border border-border">
                    <p className="font-bold text-white mb-1">BRI</p>
                    <p className="text-2xl font-mono text-primary tracking-widest">0987654321</p>
                    <p className="text-sm text-muted-foreground">a.n ANDIKA STORE</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-white mb-4">Upload Proof</h2>
              
              {order.paymentProofUrl ? (
                <div className="bg-green-500/10 border border-green-500/30 p-6 rounded-xl flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                  <CheckCircle2 className="w-16 h-16 text-green-400 mb-4" />
                  <p className="font-bold text-green-400">Proof Uploaded</p>
                  <p className="text-sm text-muted-foreground mt-2">We are verifying your payment.</p>
                </div>
              ) : (
                <div 
                  className="bg-background border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors p-6 rounded-xl flex flex-col items-center justify-center text-center h-full min-h-[200px] cursor-pointer relative"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? (
                    <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                  ) : (
                    <Upload className="w-10 h-10 text-primary mb-4" />
                  )}
                  <p className="font-bold text-white mb-1">Click to upload image</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG, max 5MB</p>
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    accept="image/*" 
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="bg-background rounded-xl p-4 border border-border">
            <h3 className="font-bold text-white mb-2 text-sm">Order Summary</h3>
            {order.items.map(item => (
              <div key={item.productId} className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">{item.quantity}x {item.productName}</span>
                <span className="text-white">{item.price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</span>
              </div>
            ))}
          </div>

        </motion.div>
      </div>
    </Layout>
  );
}
