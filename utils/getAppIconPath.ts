// utils/getAppIconPath.ts

export const getAppIconPath = (appId: string = ''): string => {
  const id = appId.toLowerCase();
  const iconMap: Record<string, string> = {
    'com.whatsapp': 'whatsapp',
    'com.instagram.android': 'instagram',
    'com.facebook.katana': 'facebook',
    'com.snapchat.android': 'snapchat',
    'com.twitter.android': 'twitter',
    'x.com': 'twitter',
    'org.telegram.messenger': 'telegram',
    'com.google.android.youtube': 'youtube',
    'com.spotify.music': 'spotify',
    'com.google.android.gm': 'gmail',
    'com.android.chrome': 'chrome',
    'com.linkedin.android': 'linkedin',
    'com.reddit.frontpage': 'reddit',
    'com.github.android': 'github',
    'com.google.android.apps.docs': 'drive',
    'com.google.android.apps.maps': 'maps',
    'com.facebook.orca': 'messenger',
    'com.slack': 'slack',
    'com.discord': 'discord',
    'us.zoom.videomeetings': 'zoom',
    'com.skype.raider': 'skype',
    'in.amazon.mShop.android.shopping': 'amazon',
    'com.netflix.mediaclient': 'netflix',
    'com.pinterest': 'pinterest',
    'com.zhiliaoapp.musically': 'tiktok',
    'net.one97.paytm': 'paytm',
    'com.phonepe.app': 'phonepe',
    'com.google.android.apps.nbu.paisa.user': 'gpay',
    'com.flipkart.android': 'flipkart',
    'in.swiggy.android': 'swiggy',
    'com.application.zomato': 'zomato',
    'com.weather.Weather': 'weather',
  };

  // 🔍 1. Match exact key first
  if (iconMap[id]) {
    console.log('Exact match:', id);
    return `https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/${iconMap[id]}.svg`;
  }

  // 🔍 2. Otherwise use "includes"
  for (const key in iconMap) {
    if (id.includes(key)) {
      console.log('Partial match:', key);
      return `https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/${iconMap[key]}.svg`;
    }
  }

  // 🔁 fallback icon
  return '/app-icons/default.png';
};
