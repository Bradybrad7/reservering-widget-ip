# 🌐 Embedding the Booking Widget on Your Website

This guide shows you how to add the Inspiration Point Theater booking widget to your personal website.

---

## 📋 Quick Overview

You have **3 options** to embed the widget:

1. **Option A**: Simple iframe embed (easiest, 2 minutes)
2. **Option B**: Script embed with library build (more control, 15 minutes)
3. **Option C**: Direct hosting on your domain (advanced, 30+ minutes)

---

## 🚀 Option A: Simple Iframe Embed (Recommended)

This is the **easiest method** - just copy and paste HTML code into your website.

### Step 1: Build and Deploy the Widget

First, build and deploy your widget to Firebase Hosting:

```powershell
# Build the application
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

After deployment, Firebase will give you a URL like:
`https://your-project-id.web.app/`

### Step 2: Add Iframe to Your Website

Add this HTML code to your personal website where you want the booking widget to appear:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Book Your Tickets - Inspiration Point Theater</title>
    <style>
        /* Remove default margins and padding */
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
        }

        /* Container for the booking widget */
        .booking-container {
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        /* Responsive iframe styling */
        .booking-iframe {
            width: 100%;
            min-height: 800px;
            border: none;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        /* Loading message */
        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
            .booking-iframe {
                min-height: 600px;
            }
            .booking-container {
                padding: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="booking-container">
        <h1>Book Your Theater Experience</h1>
        <p>Select your preferred date and time below:</p>
        
        <!-- The Booking Widget Iframe -->
        <iframe 
            src="https://your-project-id.web.app/" 
            class="booking-iframe"
            title="Inspiration Point Theater Booking Widget"
            loading="lazy"
            allow="payment"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        ></iframe>
        
        <noscript>
            <div class="loading">
                Please enable JavaScript to use the booking system.
            </div>
        </noscript>
    </div>
</body>
</html>
```

### Key Points:

- **Replace** `https://your-project-id.web.app/` with your actual Firebase URL
- The `allow="payment"` attribute enables payment processing within the iframe
- The `sandbox` attributes enable necessary functionality while maintaining security
- Mobile responsive by default

### Step 3: Test It!

Open your website and verify:
- ✅ Widget loads correctly
- ✅ You can navigate through booking steps
- ✅ Payment processing works
- ✅ Responsive on mobile devices

---

## 🔧 Option B: Script Embed (NPM Library)

This method gives you more control and integrates better with modern websites.

### Step 1: Build as Library

```powershell
# Build the widget as a JavaScript library
npm run build:lib
```

This creates files in the `dist/` folder:
- `reservation-widget.es.js` (ES modules)
- `reservation-widget.umd.js` (Universal module)
- `style.css` (Styles)

### Step 2: Host the Built Files

Upload these files to your website's server:
```
your-website.com/
  └── js/
      ├── reservation-widget.umd.js
      └── style.css
```

### Step 3: Add to Your HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Book Your Tickets</title>
    
    <!-- Load React (required dependency) -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    
    <!-- Load the widget styles -->
    <link rel="stylesheet" href="/js/style.css">
</head>
<body>
    <!-- Container where the widget will render -->
    <div id="booking-widget-root"></div>

    <!-- Load the widget script -->
    <script src="/js/reservation-widget.umd.js"></script>
    
    <!-- Initialize the widget -->
    <script>
        // Wait for the DOM to load
        document.addEventListener('DOMContentLoaded', function() {
            // Get the widget from the global scope
            const ReservationWidget = window.ReservationWidget;
            
            // Render the widget
            if (ReservationWidget && ReservationWidget.default) {
                const container = document.getElementById('booking-widget-root');
                const root = ReactDOM.createRoot(container);
                root.render(React.createElement(ReservationWidget.default));
            }
        });
    </script>
</body>
</html>
```

### Advantages:
- ✅ Better performance (no iframe overhead)
- ✅ More customization options
- ✅ Direct integration with your site's design
- ✅ Shared session/cookies with your main site

### Disadvantages:
- ❌ More complex setup
- ❌ Requires React as a dependency
- ❌ Need to rebuild and redeploy when updating

---

## 🏗️ Option C: Direct Domain Hosting

Host the entire application on your own domain.

### Step 1: Build for Production

```powershell
npm run build
```

### Step 2: Upload to Your Server

Upload the entire `dist/` folder contents to your web server:

```
your-website.com/booking/
  ├── index.html
  ├── admin.html
  ├── assets/
  │   ├── index-[hash].js
  │   ├── index-[hash].css
  │   └── ... (other files)
  └── manifest.json
```

### Step 3: Configure Server

#### For Apache (.htaccess):
```apache
# Enable React Router (single-page app routing)
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /booking/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /booking/index.html [L]
</IfModule>
```

#### For Nginx (nginx.conf):
```nginx
location /booking {
    alias /var/www/html/booking;
    try_files $uri $uri/ /booking/index.html;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Step 4: Update Firebase Configuration

If you're using Firebase, you'll need to update the configuration in your `.env` file or directly in the source code to point to your domain.

---

## 🎨 Customization Options

### Styling the Iframe (Option A)

You can customize the iframe container to match your site:

```html
<style>
    .booking-iframe {
        /* Custom border */
        border: 2px solid #your-brand-color;
        
        /* Custom shadow */
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        
        /* Custom border radius */
        border-radius: 12px;
        
        /* Custom background while loading */
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
</style>
```

### Passing Parameters via URL

You can pre-fill certain information by adding URL parameters:

```html
<iframe src="https://your-project-id.web.app/?date=2025-12-25&persons=2"></iframe>
```

### Auto-Resizing Iframe

For a better user experience, you can make the iframe auto-resize:

```html
<script>
    // Listen for messages from the iframe
    window.addEventListener('message', function(e) {
        // Verify the origin for security
        if (e.origin !== 'https://your-project-id.web.app') return;
        
        // Resize the iframe based on content height
        if (e.data.type === 'resize') {
            const iframe = document.querySelector('.booking-iframe');
            iframe.style.height = e.data.height + 'px';
        }
    });
</script>
```

Then add this to your React app (in `src/main.tsx` or `App.tsx`):

```typescript
// Send height updates to parent window
useEffect(() => {
    const sendHeight = () => {
        const height = document.documentElement.scrollHeight;
        window.parent.postMessage({ type: 'resize', height }, '*');
    };
    
    // Send initial height
    sendHeight();
    
    // Send height on window resize
    window.addEventListener('resize', sendHeight);
    
    // Send height when content changes
    const observer = new MutationObserver(sendHeight);
    observer.observe(document.body, { 
        childList: true, 
        subtree: true,
        attributes: true 
    });
    
    return () => {
        window.removeEventListener('resize', sendHeight);
        observer.disconnect();
    };
}, []);
```

---

## 🔒 Security Considerations

### For Iframe Embedding:

1. **CORS Headers**: Ensure your Firebase hosting allows iframe embedding:
```json
// firebase.json
{
  "hosting": {
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "X-Frame-Options",
            "value": "ALLOW-FROM https://your-personal-site.com"
          },
          {
            "key": "Content-Security-Policy",
            "value": "frame-ancestors 'self' https://your-personal-site.com"
          }
        ]
      }
    ]
  }
}
```

2. **Sandbox Attributes**: Use appropriate sandbox attributes:
```html
sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
```

### For Script Embedding:

1. **Content Security Policy**: Add your domain to CSP headers
2. **HTTPS Only**: Always use HTTPS in production
3. **API Keys**: Keep Firebase API keys in environment variables

---

## 📱 Mobile Optimization

The widget is already mobile-responsive, but you can optimize further:

```css
/* Full-width on mobile */
@media (max-width: 768px) {
    .booking-container {
        padding: 0;
        max-width: 100%;
    }
    
    .booking-iframe {
        border-radius: 0;
        min-height: 100vh;
    }
}

/* Tablet optimization */
@media (min-width: 769px) and (max-width: 1024px) {
    .booking-iframe {
        min-height: 700px;
    }
}
```

---

## 🧪 Testing Checklist

Before going live, test these scenarios:

- [ ] Widget loads on desktop browsers (Chrome, Firefox, Safari, Edge)
- [ ] Widget loads on mobile devices (iOS Safari, Android Chrome)
- [ ] All booking steps work correctly
- [ ] Payment processing completes successfully
- [ ] Email confirmations are sent
- [ ] Widget is responsive on different screen sizes
- [ ] No console errors in browser developer tools
- [ ] HTTPS is working (no mixed content warnings)
- [ ] Widget works with your website's navigation
- [ ] Back button behaves correctly

---

## 🆘 Troubleshooting

### Widget Doesn't Load

**Problem**: Blank iframe or loading spinner  
**Solutions**:
- Check Firebase deployment: `firebase hosting:channel:list`
- Verify the iframe URL is correct
- Check browser console for CORS errors
- Ensure JavaScript is enabled

### Payment Not Working

**Problem**: Payment step fails  
**Solutions**:
- Verify `allow="payment"` is in iframe tag
- Check Mollie/Stripe API keys in Firebase config
- Test in incognito mode to rule out extension issues

### Mobile Display Issues

**Problem**: Widget doesn't fit on mobile  
**Solutions**:
- Add `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- Use responsive CSS (provided in examples above)
- Test with Chrome DevTools mobile emulation

### Cross-Origin Errors

**Problem**: "Blocked by CORS policy" errors  
**Solutions**:
- Update `firebase.json` headers (see Security section)
- Ensure both sites use HTTPS
- Check browser console for specific error messages

---

## 🎯 Recommended Approach

For most users, we recommend **Option A (Iframe Embed)** because:

✅ Simplest setup (just HTML)  
✅ Automatic updates when you redeploy to Firebase  
✅ Isolated from your main site (better security)  
✅ Works with any website platform (WordPress, Wix, custom HTML)  
✅ No dependency management needed  

---

## 📞 Next Steps

1. Choose your embedding option (A, B, or C)
2. Follow the step-by-step instructions
3. Test thoroughly using the checklist
4. Deploy to your website
5. Monitor for any issues in the first 24 hours

Need help? Check the main README.md or create an issue in the repository.

---

**Last Updated**: November 26, 2025  
**Version**: 1.0.0
