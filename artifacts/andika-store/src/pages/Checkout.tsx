import { Layout } from "@/components/layout";
import { useGetCart, useCreateOrder, getGetCartQueryKey } from "@workspace/api-client-react";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocation, Redirect } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.string().email("Valid email required"),
  customerPhone: z.string().min(8, "Phone number required"),
  paymentMethod: z.string().min(1, "Select a payment method"),
  notes: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const { sessionId } = useSession();
  const { data: cart, isLoading: cartLoading } = useGetCart({ sessionId }, { query: { enabled: !!sessionId } });
  const createOrder = useCreateOrder();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      paymentMethod: "QRIS",
      notes: "",
    }
  });

  if (cartLoading) return <Layout><div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
  
  if (!cart || cart.items.length === 0) {
    return <Redirect to="/cart" />;
  }

  const onSubmit = (data: CheckoutFormValues) => {
    createOrder.mutate(
      { 
        data: {
          ...data,
          sessionId,
          items: cart.items,
        }
      },
      {
        onSuccess: (order) => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) });
          setLocation(`/order/${order.orderId}`);
        }
      }
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <h1 className="text-3xl font-black text-white uppercase tracking-wider mb-8 flex items-center gap-3">
          Checkout <span className="w-12 h-1 bg-primary inline-block rounded-full"></span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-card neon-border rounded-xl p-6" id="checkout-form">
              <h2 className="text-xl font-bold text-white mb-4">Customer Details</h2>
              
              <div className="space-y-2">
                <Label htmlFor="customerName">Full Name</Label>
                <Input 
                  id="customerName" 
                  className="bg-background border-border"
                  {...form.register("customerName")} 
                />
                {form.formState.errors.customerName && (
                  <p className="text-destructive text-sm">{form.formState.errors.customerName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email</Label>
                <Input 
                  id="customerEmail" 
                  type="email"
                  className="bg-background border-border"
                  {...form.register("customerEmail")} 
                />
                {form.formState.errors.customerEmail && (
                  <p className="text-destructive text-sm">{form.formState.errors.customerEmail.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number</Label>
                <Input 
                  id="customerPhone" 
                  className="bg-background border-border"
                  {...form.register("customerPhone")} 
                />
                {form.formState.errors.customerPhone && (
                  <p className="text-destructive text-sm">{form.formState.errors.customerPhone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <div className="bg-background border border-border rounded-md p-4">
                  <RadioGroup 
                    defaultValue="QRIS" 
                    onValueChange={(v) => form.setValue("paymentMethod", v)}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="QRIS" id="qris" className="text-primary" />
                      <Label htmlFor="qris" className="font-medium cursor-pointer">QRIS</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="Bank Transfer" id="bank" className="text-primary" />
                      <Label htmlFor="bank" className="font-medium cursor-pointer">Bank Transfer (BCA/BRI)</Label>
                    </div>
                  </RadioGroup>
                </div>
                {form.formState.errors.paymentMethod && (
                  <p className="text-destructive text-sm">{form.formState.errors.paymentMethod.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Order Notes (Optional)</Label>
                <Textarea 
                  id="notes" 
                  className="bg-background border-border resize-none"
                  {...form.register("notes")} 
                />
              </div>
            </form>
          </div>

          <div>
            <div className="bg-card neon-border rounded-xl p-6 sticky top-24">
              <h2 className="text-xl font-bold text-white mb-4">Order Summary</h2>
              
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                {cart.items.map(item => (
                  <div key={item.productId} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-white">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-primary">
                      {item.price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                    </p>
                  </div>
                ))}
              </div>

              <div className="h-px w-full bg-border mb-4" />
              
              <div className="flex justify-between text-white font-bold text-xl mb-8">
                <span>Total</span>
                <span className="neon-text">{cart.total.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</span>
              </div>

              <Button 
                type="submit" 
                form="checkout-form"
                disabled={createOrder.isPending}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 neon-glow text-white font-bold h-14 text-lg"
              >
                {createOrder.isPending ? "PROCESSING..." : "PLACE ORDER"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
