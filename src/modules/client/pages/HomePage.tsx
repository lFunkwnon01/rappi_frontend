import { Link } from "react-router-dom";
import { ArrowRight, Drumstick, Truck, Clock, Star } from "lucide-react";

const HIGHLIGHTS = [
  {
    icon: Drumstick,
    title: "Pollo 100% Louisiana",
    text: "Receta original, marinado 12 horas y frito al momento.",
  },
  {
    icon: Truck,
    title: "Delivery en 30 min",
    text: "Recibe tu pedido caliente directo en tu puerta.",
  },
  {
    icon: Clock,
    title: "Pedidos en vivo",
    text: "Sigue el estado de tu pedido en tiempo real desde la app.",
  },
];

export function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-popeyes-dark text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-popeyes-red via-red-700 to-popeyes-dark" />
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-popeyes-gold/30 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="chip border-popeyes-gold/50 bg-popeyes-gold/20 text-popeyes-gold">
              ★ Nuevo · Pedidos en vivo
            </span>
            <h1 className="mt-4 font-display text-5xl leading-none md:text-7xl">
              PIDE TU POLLO,
              <br />
              <span className="text-popeyes-gold">SÍGUELO EN VIVO</span>
            </h1>
            <p className="mt-4 max-w-md text-white/80">
              Bienvenido a Popeyes Perú. Haz tu pedido y mira cómo se cocina, se empaca y sale hacia tu dirección. Todo en tiempo real.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/menu" className="btn-primary bg-popeyes-gold text-popeyes-dark hover:bg-yellow-400">
                Ver carta <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/orders"
                className="btn-secondary border-white bg-transparent text-white hover:bg-white hover:text-popeyes-dark"
              >
                Mis pedidos
              </Link>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="absolute h-72 w-72 rounded-full bg-popeyes-gold/40 blur-2xl" />
            <div className="relative grid h-72 w-72 place-items-center rounded-full bg-gradient-to-br from-popeyes-gold to-popeyes-orange shadow-2xl">
              <div className="text-center">
                <div className="font-display text-8xl text-popeyes-dark">P</div>
                <div className="font-display text-sm tracking-widest text-popeyes-dark/80">
                  LOUISIANA
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-popeyes-red/10 text-popeyes-red">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-3 font-display text-2xl">{title}</h3>
              <p className="mt-1 text-sm text-popeyes-gray">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="card flex flex-col items-center gap-4 p-8 text-center md:flex-row md:text-left">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-popeyes-orange/15 text-popeyes-orange">
            <Star className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-2xl">¿Ya eres parte del equipo Popeyes?</h3>
            <p className="text-sm text-popeyes-gray">
              Si eres cocinero, despachador, repartidor o administrador, entra al panel de trabajadores para atender los pedidos en vivo.
            </p>
          </div>
          <Link to="/login" className="btn-secondary">
            Panel de trabajadores
          </Link>
        </div>
      </section>
    </>
  );
}
