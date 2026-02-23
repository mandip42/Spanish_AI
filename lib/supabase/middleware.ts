import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");
  const isAppPage =
    request.nextUrl.pathname.startsWith("/app") ||
    request.nextUrl.pathname === "/app";

  if (!user && !isAuthPage && request.nextUrl.pathname !== "/") {
    const redirect = new URL("/auth", request.url);
    return NextResponse.redirect(redirect);
  }

  if (user && isAuthPage) {
    const redirect = new URL("/app", request.url);
    return NextResponse.redirect(redirect);
  }

  return response;
}
