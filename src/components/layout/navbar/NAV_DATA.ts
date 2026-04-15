export type NavItem = {
  title: string;
  href?: string;
  columns: {
    header: string;
    items: string[];
    viewAll?: boolean;
  }[];
};

export const NAV_DATA: NavItem[] = [
  {
    title: 'Games',
    href: 'games',
    columns: [
      {
        header: 'GAMING PLATFORMS',
        items: [
          'EA Play',
          'Xbox',
          'Epic Games',
          'Nintendo',
          'PSN Games',
          'GOG.com',
          'Ubisoft Connect Games',
          'Rockstar',
        ],
        viewAll: true,
      },
      {
        header: 'POPULAR GENRES',
        items: [
          'Action',
          'Adventure',
          'Casual',
          'Indie',
          'Racing',
          'RPG',
          'Simulation',
          'Sports',
          'Strategy',
          'TPS',
          'Massively Multiplayer',
          'FPS',
        ],
      },
      {
        header: 'GAME POINTS',
        items: [
          'FC POINTS',
          'PUBG Mobile UC',
          'Garena Free Fire Diamonds',
          'Fortnite V-Bucks',
          'Minecraft: Minecoins Pack',
          'PUBG New State NC',
          'GTA Cards',
          'Valorant Points',
          'Mobile Legends',
          'Overwatch Coins',
        ],
        viewAll: true,
      },
      {
        header: 'SUBSCRIPTIONS',
        items: ['Xbox Live', 'Nintendo', 'PSN', 'Ubisoft Connect', 'EA Play'],
        viewAll: true,
      },
      {
        header: 'DLCS',
        items: [
          'Call of Duty',
          'Fortnite',
          'The Sims',
          'Destiny 2',
          'Monster Hunter',
          'House Flipper',
          'Planet Zoo',
          'Age of Empires',
        ],
        viewAll: true,
      },
    ],
  },
  {
    title: 'Gift Cards',
    href: 'gift-cards',
    columns: [
      {
        header: 'ENTERTAINMENT',
        items: ['Netflix', 'Apple', 'Meta Quest Gift Card', 'Hulu', 'Bigo Live', 'Google Play'],
        viewAll: true,
      },
      {
        header: 'RETAIL & ECOMMERCE',
        items: ['Amazon', 'Zalando', 'Penny', 'REWE', 'Flipkart', 'Walmart'],
      },
      {
        header: 'FOOD & BEVERAGE',
        items: ['Starbucks', 'Just Eat', 'DoorDash', 'Uber Eats', 'Zomato', 'Deliveroo'],
      },
      {
        header: 'TRAVEL & EXPERIENCES',
        items: [
          'Airbnb',
          'lastminute.com',
          'Hotels.com',
          'Uber',
          'Flight Centre',
          'Southwest Airlines',
        ],
      },
      {
        header: 'FASHION & APPAREL',
        items: ['H&M', 'Decathlon', 'Adidas', 'Nike', 'Swarovski', 'Ernstings Family'],
      },
      // Row 2 starts here implicitly by grid-flow
      {
        header: 'HEALTH & WELLNESS',
        items: ['Douglas', 'Rossmann', 'Shop Apotheke', 'Apollo-Optik', 'Sephora', 'Blys'],
      },
      {
        header: 'DIGITAL WALLETS & PAYMENTS',
        items: ['Neosurf', 'AstroPay', 'CASHlib', 'Flexepin', 'Rewarble', 'CashtoCode'],
      },
      {
        header: 'CRYPTO CURRENCIES',
        items: ['Azteco', 'White BIT', 'BitJem', 'Binance', 'Crypto Voucher', 'Gift Me Crypto'],
      },
      {
        header: 'ELECTRONICS & GADGETS',
        items: ['Cyberport', 'Skullcandy', 'Imagine', 'Allegro', 'Morele.net', 'Media Expert'],
      },
      { header: 'OTHER', items: ['Jet', 'BCF', 'Skype', 'Grab', 'Petro', 'Q8'] },
    ],
  },
  {
    title: 'Gaming Gift Cards',
    href: 'gaming-gift-cards',
    columns: [
      {
        header: 'PC GIFT CARDS',
        items: [
          'Steam',
          'Roblox',
          'Valorant',
          'Meta Quest',
          'World of Warcraft',
          'Blizzard',
          'League of Legends',
          'GameStop',
          'Riot Access',
        ],
      },
      {
        header: 'CONSOLE GIFT CARDS',
        items: ['PSN Gift Cards', 'Xbox Gift Cards', 'Nintendo Gift Cards'],
      },
      {
        header: 'GAME POINTS',
        items: [
          'FC 24 POINTS',
          'PUBG Mobile UC',
          'Garena Free Fire Diamonds',
          'Fortnite V-Bucks',
          'Minecraft: Minecoins Pack',
          'PUBG New State NC',
          'GTA Cards',
          'Valorant Points',
          'Mobile Legends',
          'Overwatch Coins',
        ],
        viewAll: true,
      },
    ],
  },
  {
    title: 'Subscriptions',
    href: 'subscriptions',
    columns: [
      {
        header: 'GAMING SUBSCRIPTIONS',
        items: ['Xbox Game Pass', 'Nintendo Online', 'PSN Plus', 'Ubisoft+', 'EA Play'],
      },
      {
        header: 'ENTERTAINMENT',
        items: ['Crunchyroll', 'Amazon', 'Youtube', 'Discord', 'Waipu.tv', 'Disney+'],
      },
      {
        header: 'MORE SUBSCRIPTIONS',
        items: ['Tinder', 'NordVPN', 'Apple', 'DoorDash', 'Grubhub', 'Tibia'],
      },
    ],
  },
  {
    title: 'Software',
    href: 'software',
    columns: [
      {
        header: 'SECURITY AND ANTIVIRUS',
        items: [
          'Avast Ultimate',
          'Norton',
          'Avast Premium Security',
          'AVG Ultimate',
          'McAfee LiveSafe',
          'Panda Dome Essential',
          'McAfee Total Protection',
        ],
      },
      {
        header: 'VPN',
        items: [
          'ExitLag',
          'AVG Secure VPN',
          'Surfshark VPN',
          'Avast SecureLine VPN',
          'F-Secure Freedome VPN',
        ],
      },
      {
        header: 'SYSTEM OPTIMIZATION',
        items: [
          'Avast Driver Updater',
          'Avast Cleanup Premium',
          'CCleaner Professional Plus',
          'AVG Driver Updater',
          'DRIVER BOOSTER 10',
        ],
      },
      {
        header: 'BACKUP RECOVERY',
        items: [
          'AOMEI Backupper Professional',
          'AOMEI Partition Assistant Pro',
          'EaseUS Partition Master',
          'EaseUS Todo Backup Home',
          'EaseUS Data Recovery Wizard',
        ],
      },
      {
        header: 'MORE SOFTWARES',
        items: [
          'Windows 11',
          'Ashampoo PDF Pro 3',
          'Dolby Atmos for Headphones',
          'Movavi Video Suite 2024',
          '3DMark',
          'AdGuard Premium',
        ],
      },
    ],
  },
];
