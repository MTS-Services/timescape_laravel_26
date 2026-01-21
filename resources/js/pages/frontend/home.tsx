import FrontendLayout from "@/layouts/frontend-layout";
import { Link, usePage } from "@inertiajs/react";
import { SharedData } from "@/types";
import { login, register } from "@/routes";

export default function Home({
  canRegister = true,
}: {
  canRegister?: boolean;
}) {
  const { auth } = usePage<SharedData>().props;
  // const dashboardRoute = auth.user?.is_admin ? route('dashboard') : route('dashboard');
  const dashboardRoute =  route('availability.index');

  return (
    <FrontendLayout>
      <div className="relative isolate overflow-hidden">
        {/* Background Glow Effect */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-linear-to-tr from-violet-500 to-emerald-500 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>

        <section className="mx-auto max-w-7xl px-6 pt-10 pb-24 lg:flex lg:items-center lg:gap-x-10 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:flex-auto">
            {/* Badge */}
            <div className="mb-6 flex">
              <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20 dark:text-gray-400 dark:ring-white/10">
                Seamless collaboration for creators.{" "}
                <span className="font-semibold text-violet-600">Read more &rarr;</span>
              </div>
            </div>

            <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl dark:text-white">
              Welcome to{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-violet-500 to-emerald-600">
                Team Artisan
              </span>
            </h1>

            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
              The ultimate workspace for modern teams to build, manage, and scale their projects.
              Experience a workflow designed for speed and beautiful craftsmanship.
            </p>

            <div className="mt-10 flex items-center gap-x-6">
              {auth.user ? (
                <Link
                  href={dashboardRoute}
                  className="rounded-md bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 transition-all"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href={login()}
                    className="rounded-md bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 transition-all"
                  >
                    Get Started
                  </Link>
                  {canRegister && (
                    <Link
                      href={register()}
                      className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:opacity-80"
                    >
                      Create an account <span aria-hidden="true">→</span>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Feature Grid / Visual Placeholder */}
          <div className="mt-16 sm:mt-24 lg:mt-0 lg:shrink-0 lg:grow">
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 rounded-xl bg-gray-900/5 ring-1 ring-inset ring-gray-900/10 dark:bg-white/5 dark:ring-white/10 p-4">
                  <div className="h-2 w-10 rounded bg-violet-500/50 mb-2"></div>
                  <div className="h-2 w-full rounded bg-gray-300 dark:bg-gray-700"></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </FrontendLayout>
  );
}
