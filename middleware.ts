import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "site-auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function middleware(request: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.next();

  const cookie = request.cookies.get(COOKIE_NAME);
  if (cookie?.value === password) return NextResponse.next();

  const url = request.nextUrl;
  const attempt = url.searchParams.get("password");
  if (attempt === password) {
    const redirectUrl = url.clone();
    redirectUrl.searchParams.delete("password");
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set(COOKIE_NAME, password, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
    });
    return response;
  }

  return new NextResponse(
    `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Access Required</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;background:#fafafa}
.card{background:#fff;border-radius:12px;padding:48px;box-shadow:0 2px 24px rgba(0,0,0,.06);text-align:center;max-width:380px;width:100%}
h1{font-size:18px;font-weight:600;margin-bottom:8px;color:#111}
p{font-size:14px;color:#666;margin-bottom:24px}
input{width:100%;padding:12px 16px;border:1px solid #ddd;border-radius:8px;font-size:15px;outline:none;margin-bottom:12px}
input:focus{border-color:#111}
button{width:100%;padding:12px;background:#111;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:500;cursor:pointer}
button:hover{background:#333}
</style>
</head>
<body>
<div class="card">
<h1>Access Required</h1>
<p>Enter the password to view this site.</p>
<form method="GET">
<input type="password" name="password" placeholder="Password" autofocus required>
<button type="submit">Enter</button>
</form>
</div>
</body>
</html>`,
    { status: 401, headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|fonts|icons|api).*)"],
};
