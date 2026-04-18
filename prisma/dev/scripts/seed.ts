import { prisma } from '@/lib/prisma';

interface SeedQuestion {
  text: string;
  correctCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  options: Record<string, string>;
  answer: { correctOptions: string[]; explanations: Record<string, string> };
}

interface SeedTopic {
  name: string;
  minQuestions: number;
  maxQuestions: number;
  questions: SeedQuestion[];
}

interface SeedCertification {
  certificationTitle: string;
  certificationKey: string;
  topics: SeedTopic[];
}

const SEED_DATA: SeedCertification[] = [
  {
    certificationTitle: 'SAP Certified Associate - Business User - SAP Commerce Cloud',
    certificationKey: '(C_C4H32_2411)',
    topics: [
      {
        name: 'Product Content Management',
        minQuestions: 0.11,
        maxQuestions: 0.20,
        questions: [
          {
            text: 'What is the primary purpose of the Product Cockpit in SAP Commerce Cloud?',
            correctCount: 1,
            difficulty: 'easy',
            options: {
              A: 'Managing customer orders',
              B: 'Creating and managing product catalog content',
              C: 'Configuring payment gateways',
              D: 'Monitoring server performance',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Order management is handled in the Order Management module, not the Product Cockpit.',
                B: 'Correct. The Product Cockpit is the central tool for managing product information and catalog content.',
                C: 'Payment configuration is done in the backoffice administration, not the Product Cockpit.',
                D: 'Server monitoring is a system administration task, unrelated to the Product Cockpit.',
              },
            },
          },
          {
            text: 'Which catalog type in SAP Commerce Cloud contains the approved and published product data?',
            correctCount: 1,
            difficulty: 'easy',
            options: {
              A: 'Staged catalog',
              B: 'Draft catalog',
              C: 'Online catalog',
              D: 'Master catalog',
            },
            answer: {
              correctOptions: ['C'],
              explanations: {
                A: 'The staged catalog holds work-in-progress data before synchronization.',
                B: 'There is no "Draft catalog" concept in SAP Commerce Cloud.',
                C: 'Correct. The online catalog holds the synchronized, published data visible to customers.',
                D: 'The master catalog is a logical grouping concept, not the published version.',
              },
            },
          },
          {
            text: 'What does catalog synchronization accomplish in SAP Commerce Cloud?',
            correctCount: 1,
            difficulty: 'medium',
            options: {
              A: 'Copies data from the online catalog to the staged catalog',
              B: 'Copies data from the staged catalog to the online catalog',
              C: 'Merges two staged catalogs into one',
              D: 'Deletes outdated product variants',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Synchronization flows from staged to online, not the reverse.',
                B: 'Correct. Synchronization promotes approved staged content to the online catalog.',
                C: 'Merging catalogs is not the purpose of synchronization.',
                D: 'Deletion of variants is a separate catalog maintenance task.',
              },
            },
          },
          {
            text: 'Which of the following best describes a product variant in SAP Commerce Cloud?',
            correctCount: 1,
            difficulty: 'medium',
            options: {
              A: 'A product that exists in multiple stores',
              B: 'A specific configuration of a base product, such as size or color',
              C: 'A bundle of products sold together at a discount',
              D: 'A product with dynamic pricing rules',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Products in multiple stores use multi-site configuration, not variants.',
                B: 'Correct. Variants represent specific configurations like size XL or color Red of a base product.',
                C: 'Product bundles are a separate product type.',
                D: 'Dynamic pricing is handled via price rules, not variants.',
              },
            },
          },
          {
            text: 'What is the role of classifications in SAP Commerce Cloud product content?',
            correctCount: 1,
            difficulty: 'hard',
            options: {
              A: 'They define price tiers for products',
              B: 'They provide additional structured attributes beyond the base product type',
              C: 'They control which users can edit product data',
              D: 'They determine the shipping weight of products',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Price tiers are managed through price rows and price rules.',
                B: 'Correct. Classification systems allow adding domain-specific attributes to products without changing the type system.',
                C: 'Access control is handled through user groups and permissions.',
                D: 'Shipping weight is a product attribute, not a classification concept.',
              },
            },
          },
          {
            text: 'Which tool would you use to import product data in bulk into SAP Commerce Cloud?',
            correctCount: 1,
            difficulty: 'medium',
            options: {
              A: 'ImpEx',
              B: 'Backoffice Search',
              C: 'Product Cockpit wizard',
              D: 'SmartEdit',
            },
            answer: {
              correctOptions: ['A'],
              explanations: {
                A: 'Correct. ImpEx is the standard import/export scripting language for bulk data operations in SAP Commerce Cloud.',
                B: 'Backoffice Search is used to find and view items, not import in bulk.',
                C: 'The Product Cockpit wizard is for manual product creation, not bulk import.',
                D: 'SmartEdit is a storefront content editing tool.',
              },
            },
          },
          {
            text: 'What is the purpose of a base product in an SAP Commerce Cloud variant structure?',
            correctCount: 1,
            difficulty: 'easy',
            options: {
              A: 'It is the product customers add directly to the cart',
              B: 'It is the parent product that holds shared attributes for all its variants',
              C: 'It is the product displayed in promotions',
              D: 'It is the default product when no variant is selected',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Customers add specific variants to the cart, not the base product.',
                B: 'Correct. The base product contains common attributes inherited by all its variant products.',
                C: 'Promotions can target base products or variants; this is not the defining purpose.',
                D: 'If no variant is selected, the system typically prevents adding to cart rather than defaulting.',
              },
            },
          },
          {
            text: 'In SAP Commerce Cloud, what does the term "approval status" refer to for products?',
            correctCount: 1,
            difficulty: 'medium',
            options: {
              A: 'Whether the product has been reviewed and approved for the online catalog',
              B: 'Whether the product has been approved for export to third-party systems',
              C: 'Whether the product price has been approved by finance',
              D: 'Whether the product images have passed quality review',
            },
            answer: {
              correctOptions: ['A'],
              explanations: {
                A: 'Correct. Approval status indicates whether a product is ready to be synchronized to the online catalog.',
                B: 'Third-party export approval is not a standard Commerce Cloud concept.',
                C: 'Price approval is not tracked via product approval status.',
                D: 'Image quality review is not the purpose of the approval status field.',
              },
            },
          },
          {
            text: 'Which of the following statements about catalog versions in SAP Commerce Cloud is correct?',
            correctCount: 1,
            difficulty: 'hard',
            options: {
              A: 'Only one catalog version can exist per catalog',
              B: 'Each catalog has exactly two versions: staged and online',
              C: 'A catalog can have multiple staged versions but only one online version',
              D: 'Catalog versions are automatically deleted after synchronization',
            },
            answer: {
              correctOptions: ['C'],
              explanations: {
                A: 'A catalog can have multiple versions.',
                B: 'This is the typical setup but not a hard constraint; multiple staged versions are possible.',
                C: 'Correct. SAP Commerce Cloud supports multiple staged catalog versions while maintaining one online version.',
                D: 'Catalog versions are not deleted after synchronization.',
              },
            },
          },
          {
            text: 'How are media items (images, documents) associated with products in SAP Commerce Cloud?',
            correctCount: 1,
            difficulty: 'easy',
            options: {
              A: 'Via URL references stored as plain text attributes',
              B: 'Through Media and MediaContainer items linked to the product',
              C: 'By uploading directly to the product variant only',
              D: 'Using an external CDN integration that bypasses the catalog',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Media is stored as proper Media items in the platform, not plain text URLs.',
                B: 'Correct. Media items and MediaContainers are platform objects linked to products and can hold multiple formats.',
                C: 'Media can be associated with both base products and variants.',
                D: 'CDN may be used for delivery but media is still managed through the platform.',
              },
            },
          },
        ],
      },
      {
        name: 'Web Content Management',
        minQuestions: 0.11,
        maxQuestions: 0.20,
        questions: [
          {
            text: 'What is SmartEdit in SAP Commerce Cloud?',
            correctCount: 1,
            difficulty: 'easy',
            options: {
              A: 'A tool for managing product classifications',
              B: 'A WYSIWYG storefront content editing interface',
              C: 'A code editor for WCMS components',
              D: 'A bulk import tool for CMS pages',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Classifications are managed in Backoffice, not SmartEdit.',
                B: 'Correct. SmartEdit provides a live, in-context editing experience for storefront content.',
                C: 'Component code is managed by developers, not through SmartEdit.',
                D: 'Bulk import uses ImpEx, not SmartEdit.',
              },
            },
          },
          {
            text: 'What is a CMS Page Template in SAP Commerce Cloud?',
            correctCount: 1,
            difficulty: 'medium',
            options: {
              A: 'A reusable layout blueprint that defines slot positions on a page',
              B: 'A saved version of a content page for rollback purposes',
              C: 'A marketing template used for email campaigns',
              D: 'A template for generating product description HTML',
            },
            answer: {
              correctOptions: ['A'],
              explanations: {
                A: 'Correct. Page templates define the layout structure with named content slots.',
                B: 'Versioning/rollback is a separate content versioning concept.',
                C: 'Email templates are unrelated to CMS page templates.',
                D: 'Product descriptions are managed as product attributes, not CMS templates.',
              },
            },
          },
          {
            text: 'Which type of CMS component would you use to display a static HTML snippet on a page?',
            correctCount: 1,
            difficulty: 'easy',
            options: {
              A: 'CMSParagraphComponent',
              B: 'ProductCarouselComponent',
              C: 'NavigationComponent',
              D: 'FlashComponent',
            },
            answer: {
              correctOptions: ['A'],
              explanations: {
                A: 'Correct. CMSParagraphComponent renders a block of rich text or HTML.',
                B: 'ProductCarouselComponent displays a rotating list of products.',
                C: 'NavigationComponent renders navigation menus.',
                D: 'FlashComponent is not a standard SAP Commerce Cloud component.',
              },
            },
          },
          {
            text: 'What is the purpose of content slots in SAP Commerce Cloud CMS?',
            correctCount: 1,
            difficulty: 'medium',
            options: {
              A: 'They define database storage partitions for CMS data',
              B: 'They are named regions on a page where CMS components are placed',
              C: 'They represent time-based scheduling windows for content display',
              D: 'They are placeholders for product variant images',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Content slots are not related to database storage.',
                B: 'Correct. Content slots are named areas on a page template where CMS components are assigned.',
                C: 'Time-based content is handled via restrictions, not slots.',
                D: 'Product images are managed separately from CMS slots.',
              },
            },
          },
          {
            text: 'How does a CMS restriction work in SAP Commerce Cloud?',
            correctCount: 1,
            difficulty: 'hard',
            options: {
              A: 'It prevents unauthorized users from editing CMS pages',
              B: 'It controls under what conditions a component or page is displayed',
              C: 'It restricts the number of components allowed in a slot',
              D: 'It limits the file size of uploaded media',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Edit permissions are controlled by user roles, not CMS restrictions.',
                B: 'Correct. CMS restrictions (time, user group, category) determine when content is shown.',
                C: 'Slot capacity is not controlled by CMS restrictions.',
                D: 'Media upload limits are a system configuration, not a CMS restriction.',
              },
            },
          },
          {
            text: 'What is the difference between a global content slot and a local content slot in SAP Commerce?',
            correctCount: 1,
            difficulty: 'hard',
            options: {
              A: 'Global slots are shared across all pages; local slots are specific to one page',
              B: 'Global slots are only for the homepage; local slots are for category pages',
              C: 'Global slots cannot contain media; local slots can',
              D: 'There is no difference; the terms are interchangeable',
            },
            answer: {
              correctOptions: ['A'],
              explanations: {
                A: 'Correct. Global slots share components across all pages using that template; local slots are page-specific overrides.',
                B: 'Global slots are not restricted to the homepage.',
                C: 'Both slot types can contain media components.',
                D: 'The distinction between global and local is a fundamental CMS concept.',
              },
            },
          },
          {
            text: 'Which component type renders a rotating banner on the storefront?',
            correctCount: 1,
            difficulty: 'easy',
            options: {
              A: 'RotatingImagesComponent',
              B: 'BannerComponent',
              C: 'CMSImageComponent',
              D: 'SimpleResponsiveBannerComponent',
            },
            answer: {
              correctOptions: ['A'],
              explanations: {
                A: 'Correct. RotatingImagesComponent (or similar carousel component) displays multiple rotating banners.',
                B: 'BannerComponent displays a single static banner.',
                C: 'CMSImageComponent renders a single image.',
                D: 'SimpleResponsiveBannerComponent is a single responsive image, not rotating.',
              },
            },
          },
          {
            text: 'How can you preview a page with a pending content change in SAP Commerce Cloud?',
            correctCount: 1,
            difficulty: 'medium',
            options: {
              A: 'Synchronize the staged catalog and check the live site',
              B: 'Use the SmartEdit preview mode with the staged catalog version',
              C: 'Export the page to a preview server',
              D: 'Use the ImpEx console to query the staged version',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Synchronizing promotes content to live, which is not a safe preview method.',
                B: 'Correct. SmartEdit allows previewing the staged catalog content before it goes live.',
                C: 'SAP Commerce does not export pages to a separate preview server.',
                D: 'ImpEx is a data import/export tool, not a preview mechanism.',
              },
            },
          },
          {
            text: 'What is the ContentPage type used for in SAP Commerce Cloud CMS?',
            correctCount: 1,
            difficulty: 'easy',
            options: {
              A: 'Only for the homepage',
              B: 'For generic informational pages not tied to a specific catalog item',
              C: 'Exclusively for checkout pages',
              D: 'For pages that display a single product',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'The homepage uses a ContentPage but ContentPage is not limited to it.',
                B: 'Correct. ContentPages are used for static/informational content like About Us, FAQ, etc.',
                C: 'Checkout pages use specific page types like CheckoutPage.',
                D: 'Product pages use ProductPage type.',
              },
            },
          },
          {
            text: 'What is the role of a navigation node in SAP Commerce Cloud?',
            correctCount: 1,
            difficulty: 'medium',
            options: {
              A: 'It defines a URL redirect rule',
              B: 'It represents an item in the site navigation tree and can link to pages or URLs',
              C: 'It is a background process that checks for broken links',
              D: 'It maps a category to a CMS page template',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'URL redirects are managed separately via URL mappings.',
                B: 'Correct. Navigation nodes build the site menu structure and can link to CMS pages or external URLs.',
                C: 'Link checking is not done via navigation nodes.',
                D: 'Category-to-template mapping is a different configuration.',
              },
            },
          },
        ],
      },
      {
        name: 'Commerce Management',
        minQuestions: 0.11,
        maxQuestions: 0.20,
        questions: [
          {
            text: 'What is the purpose of price rows in SAP Commerce Cloud?',
            correctCount: 1,
            difficulty: 'easy',
            options: {
              A: 'To define which products appear in promotions',
              B: 'To set the price of a product for specific users, currencies, or quantities',
              C: 'To configure shipping costs for products',
              D: 'To define product weight for tax calculation',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Promotion assignments use promotion rules, not price rows.',
                B: 'Correct. Price rows define product prices and can be scoped by user group, currency, minimum quantity, and date range.',
                C: 'Shipping costs are configured via delivery modes and zones.',
                D: 'Product weight is a product attribute.',
              },
            },
          },
          {
            text: 'In SAP Commerce Cloud, what is a BaseStore?',
            correctCount: 1,
            difficulty: 'medium',
            options: {
              A: 'The main database schema for the platform',
              B: 'A configuration object representing a web shop with its settings, currencies, and catalogs',
              C: 'The base class for all storefront components',
              D: 'A template store used before customization',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'The database schema is not called a BaseStore.',
                B: 'Correct. A BaseStore aggregates settings like currencies, countries, catalogs, payment providers for a specific shop.',
                C: 'Storefront components are CMS concepts, not related to BaseStore.',
                D: 'BaseStore is a real operational configuration, not just a template.',
              },
            },
          },
          {
            text: 'How does SAP Commerce Cloud handle multi-currency pricing?',
            correctCount: 1,
            difficulty: 'medium',
            options: {
              A: 'It automatically converts prices using a fixed exchange rate table',
              B: 'Each currency must have explicit price rows defined for products',
              C: 'Prices are always stored in USD and converted at checkout',
              D: 'Currency is set per order and does not affect product price rows',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'While conversion is possible, the preferred approach is explicit price rows per currency.',
                B: 'Correct. Each currency typically has its own price rows for accurate pricing.',
                C: 'SAP Commerce does not force a single base currency.',
                D: 'Currency does affect which price rows are selected.',
              },
            },
          },
          {
            text: 'What is the Cart in SAP Commerce Cloud?',
            correctCount: 1,
            difficulty: 'easy',
            options: {
              A: 'A saved list of favorite products',
              B: 'A transient order object representing the customer\'s current selection before checkout',
              C: 'A permanent record of purchased items',
              D: 'A type of promotion applied at checkout',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'A wish list or saved cart is a separate feature.',
                B: 'Correct. The Cart is the in-progress order before it is placed and converted to a real Order.',
                C: 'Permanent purchase records are Orders.',
                D: 'Promotions are a separate concept from the cart itself.',
              },
            },
          },
          {
            text: 'Which of the following is used to configure tax rates in SAP Commerce Cloud?',
            correctCount: 1,
            difficulty: 'hard',
            options: {
              A: 'Price rows with a tax flag',
              B: 'Tax categories and tax values assigned to products and zones',
              C: 'A global tax percentage in the BaseStore settings',
              D: 'Promotion rules with tax modifiers',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Price rows do not carry tax configuration.',
                B: 'Correct. Tax categories are linked to products, and tax values define rates per zone/country.',
                C: 'There is no single global tax percentage field on BaseStore.',
                D: 'Promotions do not configure tax rates.',
              },
            },
          },
          {
            text: 'What is the purpose of a voucher in SAP Commerce Cloud?',
            correctCount: 1,
            difficulty: 'easy',
            options: {
              A: 'A discount code customers apply to get a price reduction on their cart',
              B: 'A digital gift card stored in the customer\'s account',
              C: 'A system alert notifying administrators of low stock',
              D: 'A media file attached to a promotional email',
            },
            answer: {
              correctOptions: ['A'],
              explanations: {
                A: 'Correct. Vouchers (coupon codes) are applied to carts to grant discounts.',
                B: 'Gift cards are a separate feature from vouchers.',
                C: 'Stock alerts are unrelated to vouchers.',
                D: 'Media files are not called vouchers.',
              },
            },
          },
          {
            text: 'In SAP Commerce Cloud, what does "stock level" refer to?',
            correctCount: 1,
            difficulty: 'easy',
            options: {
              A: 'The minimum price threshold for a product',
              B: 'The available inventory quantity for a product in a warehouse',
              C: 'The customer loyalty tier',
              D: 'The number of product variants available',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Price thresholds are price-related, not stock.',
                B: 'Correct. Stock levels track inventory availability per product and warehouse.',
                C: 'Customer loyalty is a separate concept.',
                D: 'Variant count is a product model attribute, not a stock concept.',
              },
            },
          },
          {
            text: 'What is a delivery mode in SAP Commerce Cloud?',
            correctCount: 1,
            difficulty: 'medium',
            options: {
              A: 'The channel through which an order is placed (web, mobile, store)',
              B: 'A configured shipping option with associated costs and carriers',
              C: 'A rule that determines if free shipping applies',
              D: 'The default payment method for a customer',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Channels are related to sites/CMSSites, not delivery modes.',
                B: 'Correct. A delivery mode represents a shipping option (e.g., Standard, Express) with its cost calculation.',
                C: 'Free shipping conditions are defined as promotions.',
                D: 'Payment methods are configured separately.',
              },
            },
          },
          {
            text: 'Which feature allows SAP Commerce Cloud to support multiple online stores from one installation?',
            correctCount: 1,
            difficulty: 'hard',
            options: {
              A: 'Multi-site configuration using multiple CMSSites and BaseStores',
              B: 'Running separate application server instances per store',
              C: 'Using a different database schema per store',
              D: 'Cloning the entire SAP Commerce installation',
            },
            answer: {
              correctOptions: ['A'],
              explanations: {
                A: 'Correct. SAP Commerce Cloud supports multi-site natively through CMSSite and BaseStore configuration.',
                B: 'Multiple server instances are not required for multi-site.',
                C: 'Separate database schemas are not needed.',
                D: 'Cloning the installation is not the multi-site approach.',
              },
            },
          },
          {
            text: 'What is a user group used for in SAP Commerce Cloud commerce configuration?',
            correctCount: 1,
            difficulty: 'medium',
            options: {
              A: 'Grouping administrators with similar server access rights',
              B: 'Scoping prices, promotions, and catalog visibility to specific customer segments',
              C: 'Organizing CMS components into reusable sets',
              D: 'Defining warehouse zones for stock allocation',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Admin access rights are a separate permission concept.',
                B: 'Correct. User groups allow scoping of prices, promotions, and access to specific customer segments.',
                C: 'CMS components are organized into slots and templates, not user groups.',
                D: 'Warehouse zones are a separate logistics concept.',
              },
            },
          },
        ],
      },
      {
        name: 'Order Management and Customer Support',
        minQuestions: 0.11,
        maxQuestions: 0.20,
        questions: [
          {
            text: 'What is the order lifecycle status "PAYMENT_CAPTURED" in SAP Commerce Cloud?',
            correctCount: 1,
            difficulty: 'medium',
            options: {
              A: 'The payment authorization has been requested',
              B: 'The payment has been successfully charged and funds are captured',
              C: 'The order has been shipped to the customer',
              D: 'The order is waiting for payment method verification',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Authorization is an earlier step before capture.',
                B: 'Correct. PAYMENT_CAPTURED means funds have been successfully collected from the customer.',
                C: 'Shipping is tracked by a different status.',
                D: 'Waiting for verification is an earlier status.',
              },
            },
          },
          {
            text: 'What is a consignment in SAP Commerce Cloud Order Management?',
            correctCount: 1,
            difficulty: 'medium',
            options: {
              A: 'The complete order sent to a single customer',
              B: 'A shipment of one or more order entries from a specific warehouse or source',
              C: 'A tax document generated at order placement',
              D: 'A return authorization created for a refund',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'An order can have multiple consignments.',
                B: 'Correct. A consignment groups order items that are shipped together from a sourcing location.',
                C: 'Tax documents are separate.',
                D: 'Return authorizations are different objects.',
              },
            },
          },
          {
            text: 'Which SAP Commerce Cloud feature allows customer service agents to place orders on behalf of customers?',
            correctCount: 1,
            difficulty: 'easy',
            options: {
              A: 'ASM (Assisted Service Module)',
              B: 'Backoffice Order Console',
              C: 'Customer Impersonation Plugin',
              D: 'OMS Dashboard',
            },
            answer: {
              correctOptions: ['A'],
              explanations: {
                A: 'Correct. ASM allows customer service agents to emulate a customer session and assist them.',
                B: 'The Backoffice Order Console is for viewing/managing orders but not for agent-assisted shopping.',
                C: 'There is no standard "Customer Impersonation Plugin".',
                D: 'The OMS Dashboard is for order management operations, not agent-assisted sales.',
              },
            },
          },
          {
            text: 'What does sourcing mean in SAP Commerce Cloud OMS (Order Management System)?',
            correctCount: 1,
            difficulty: 'hard',
            options: {
              A: 'Selecting the supplier for product procurement',
              B: 'Determining which warehouse or location will fulfill each order line',
              C: 'Setting the origin country for customs purposes',
              D: 'Choosing the payment provider for the transaction',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Supplier selection is a procurement concept, not OMS sourcing.',
                B: 'Correct. OMS sourcing determines the optimal fulfillment location for each order line based on stock availability and rules.',
                C: 'Customs origin is a logistics attribute, not an OMS sourcing concept.',
                D: 'Payment provider selection is a checkout configuration.',
              },
            },
          },
          {
            text: 'How can a customer service representative cancel an order in SAP Commerce Cloud?',
            correctCount: 1,
            difficulty: 'medium',
            options: {
              A: 'By deleting the order record in the database',
              B: 'By changing the order status to CANCELLED via Backoffice or ASM',
              C: 'By reversing the payment authorization only',
              D: 'Only the customer can cancel from the storefront',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Direct database deletion is not the correct process.',
                B: 'Correct. CS representatives can cancel orders via Backoffice or ASM, which triggers the cancellation workflow.',
                C: 'Reversing payment alone does not cancel the order.',
                D: 'CS representatives do have the ability to cancel orders.',
              },
            },
          },
          {
            text: 'What is the Return Request in SAP Commerce Cloud?',
            correctCount: 1,
            difficulty: 'easy',
            options: {
              A: 'A promotional return credit applied to an account',
              B: 'A formal object representing a customer\'s request to return items from an order',
              C: 'A backend job that processes refunds automatically',
              D: 'An API call that reverses a payment transaction',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Promotional credits are separate.',
                B: 'Correct. A Return Request captures which items are being returned and initiates the return workflow.',
                C: 'The automated refund processing is a workflow action, not the Return Request itself.',
                D: 'Payment reversal is triggered as part of the process but is not the Return Request.',
              },
            },
          },
          {
            text: 'Which of the following best describes a Refund in SAP Commerce Cloud OMS?',
            correctCount: 1,
            difficulty: 'medium',
            options: {
              A: 'A discount applied to future orders as compensation',
              B: 'The financial reversal of a payment back to the customer after a return or cancellation',
              C: 'An exchange of one product for another',
              D: 'A store credit that cannot be used online',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Future discounts are promotions, not refunds.',
                B: 'Correct. A refund returns money to the customer\'s original payment method.',
                C: 'Exchanges involve creating a new order, not a refund.',
                D: 'Store credits are a separate concept.',
              },
            },
          },
          {
            text: 'What information is captured in an order\'s "delivery address" in SAP Commerce Cloud?',
            correctCount: 1,
            difficulty: 'easy',
            options: {
              A: 'The address of the company\'s warehouse',
              B: 'The address where the customer wants the order shipped',
              C: 'The address associated with the payment card',
              D: 'The registered address of the store',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'The warehouse address is not the delivery address.',
                B: 'Correct. The delivery address is the customer-provided shipping destination.',
                C: 'The billing address is associated with the payment card.',
                D: 'The store address is not the delivery address.',
              },
            },
          },
          {
            text: 'In SAP Commerce Cloud, what does split shipment mean?',
            correctCount: 1,
            difficulty: 'hard',
            options: {
              A: 'An order sent to two different customers',
              B: 'Order items shipped in multiple consignments from one or more locations',
              C: 'A shipment where costs are shared between the customer and the store',
              D: 'A delivery that is split across two calendar days',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Orders are associated with one customer.',
                B: 'Correct. Split shipment means fulfilling an order in multiple partial deliveries, possibly from different warehouses.',
                C: 'Cost-sharing is not what split shipment refers to.',
                D: 'Calendar scheduling is not the definition of split shipment.',
              },
            },
          },
          {
            text: 'Which SAP Commerce Cloud feature allows agents to view a customer\'s 360-degree profile including orders, carts, and interactions?',
            correctCount: 1,
            difficulty: 'medium',
            options: {
              A: 'Customer 360° view in ASM',
              B: 'Backoffice Customer Report',
              C: 'CMS Page Restrictions',
              D: 'Product Interest Tracker',
            },
            answer: {
              correctOptions: ['A'],
              explanations: {
                A: 'Correct. ASM\'s Customer 360 view provides agents with a comprehensive view of customer activity.',
                B: 'Backoffice Customer Report is not a standard feature with that name.',
                C: 'CMS Restrictions control content visibility, not customer profiles.',
                D: 'Product Interest Tracker is not a standard ASM feature.',
              },
            },
          },
        ],
      },
      {
        name: 'Integrations',
        minQuestions: 0.01,
        maxQuestions: 0.10,
        questions: [
          {
            text: 'What protocol does SAP Commerce Cloud OCC (Omni Commerce Connect) API use?',
            correctCount: 1,
            difficulty: 'easy',
            options: {
              A: 'SOAP over HTTPS',
              B: 'REST over HTTPS',
              C: 'GraphQL over WebSocket',
              D: 'EDI over FTP',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'SAP Commerce Cloud OCC is REST-based, not SOAP.',
                B: 'Correct. OCC is a RESTful API exposed over HTTPS.',
                C: 'GraphQL is not the standard OCC protocol.',
                D: 'EDI/FTP is for legacy system integrations, not OCC.',
              },
            },
          },
          {
            text: 'What is the SAP Commerce Cloud Data Hub used for?',
            correctCount: 1,
            difficulty: 'hard',
            options: {
              A: 'Managing the storefront navigation structure',
              B: 'Orchestrating data import from multiple external systems into SAP Commerce',
              C: 'Handling real-time stock updates from the storefront',
              D: 'Configuring the Solr search index',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Navigation is managed via CMS navigation nodes.',
                B: 'Correct. Data Hub (now called Commerce Integration Framework) orchestrates complex data import pipelines from ERP and other systems.',
                C: 'Real-time stock is handled via inventory service integrations.',
                D: 'Solr configuration is separate.',
              },
            },
          },
          {
            text: 'Which integration standard does SAP Commerce Cloud support for connecting to SAP ERP for order replication?',
            correctCount: 1,
            difficulty: 'hard',
            options: {
              A: 'Only custom REST APIs',
              B: 'IDoc-based integration via SAP integration middleware like SAP Integration Suite',
              C: 'Direct JDBC connection to SAP ERP database',
              D: 'GraphQL subscriptions',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'REST APIs exist but are not the primary ERP integration standard.',
                B: 'Correct. SAP Commerce Cloud integrates with SAP ERP using IDocs through SAP PI/PO or SAP Integration Suite.',
                C: 'Direct database connections to ERP are not supported or recommended.',
                D: 'GraphQL subscriptions are not the ERP integration standard.',
              },
            },
          },
          {
            text: 'What is the purpose of the SAP Commerce Cloud Accelerator?',
            correctCount: 1,
            difficulty: 'medium',
            options: {
              A: 'A hardware accelerator for improving server response times',
              B: 'A set of pre-built reference storefront templates to speed up implementation',
              C: 'A caching layer for product search results',
              D: 'An AI tool for automatic content generation',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Accelerator is a software concept, not hardware.',
                B: 'Correct. The Accelerator provides ready-made storefront blueprints (B2C, B2B) to speed up project delivery.',
                C: 'Caching is handled by different mechanisms.',
                D: 'AI content generation is not what Accelerator refers to.',
              },
            },
          },
          {
            text: 'How does SAP Commerce Cloud expose its functionality to mobile apps?',
            correctCount: 1,
            difficulty: 'medium',
            options: {
              A: 'Only through server-side rendered pages',
              B: 'Through the OCC REST API consumed by native or hybrid mobile apps',
              C: 'Via a dedicated mobile SDK that embeds a web view',
              D: 'SAP Commerce Cloud does not support mobile apps',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Mobile apps typically consume APIs, not server-rendered HTML.',
                B: 'Correct. The OCC REST API is designed for headless consumption by mobile and other clients.',
                C: 'No specific mobile SDK embeds Commerce web views.',
                D: 'Mobile is a primary supported channel.',
              },
            },
          },
          {
            text: 'What is SAP Commerce Cloud Composable Storefront (formerly Spartacus)?',
            correctCount: 1,
            difficulty: 'medium',
            options: {
              A: 'A Java-based server-side rendering framework',
              B: 'An Angular-based open-source headless storefront that consumes the OCC API',
              C: 'A React Native mobile application for Commerce Cloud',
              D: 'A Python microservice for product catalog synchronization',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Composable Storefront is Angular-based and client-side, not Java server-side.',
                B: 'Correct. Spartacus / Composable Storefront is an Angular SPA that connects to Commerce Cloud via OCC.',
                C: 'It is not a React Native app.',
                D: 'It is not a Python service.',
              },
            },
          },
          {
            text: 'What role does OAuth 2.0 play in SAP Commerce Cloud integrations?',
            correctCount: 1,
            difficulty: 'hard',
            options: {
              A: 'It encrypts product catalog data in transit',
              B: 'It provides token-based authentication for OCC API consumers',
              C: 'It defines the IDoc format for ERP integration',
              D: 'It manages user session cookies in the storefront',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'HTTPS handles encryption in transit.',
                B: 'Correct. OAuth 2.0 is used to issue access tokens for secure API calls to the OCC layer.',
                C: 'IDoc format is defined by SAP, not OAuth.',
                D: 'Session cookies are a web session mechanism, not OAuth.',
              },
            },
          },
          {
            text: 'Which SAP tool is commonly used to map and transform data when integrating Commerce Cloud with external systems?',
            correctCount: 1,
            difficulty: 'hard',
            options: {
              A: 'SAP Analytics Cloud',
              B: 'SAP Integration Suite (formerly SAP Cloud Platform Integration)',
              C: 'SAP BusinessObjects',
              D: 'SAP Fiori Launchpad',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'SAP Analytics Cloud is for BI and reporting, not integration middleware.',
                B: 'Correct. SAP Integration Suite provides integration flows (iFlows) for mapping, routing, and transforming data between Commerce and other systems.',
                C: 'SAP BusinessObjects is a reporting tool.',
                D: 'SAP Fiori Launchpad is a UI framework for SAP apps.',
              },
            },
          },
          {
            text: 'What is a webhook in the context of SAP Commerce Cloud integrations?',
            correctCount: 1,
            difficulty: 'medium',
            options: {
              A: 'A scheduled batch job that polls external systems',
              B: 'An HTTP callback sent by Commerce Cloud to notify an external system of an event',
              C: 'A UI component for embedding external content in the storefront',
              D: 'A type of ImpEx script triggered on data changes',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Batch polling is a different integration pattern.',
                B: 'Correct. Webhooks push event notifications (e.g., order placed) to an external endpoint via HTTP POST.',
                C: 'UI embedding is not what a webhook is.',
                D: 'ImpEx scripts are data import tools, not event notifications.',
              },
            },
          },
          {
            text: 'What format is typically used for bulk product data feeds sent to external marketplaces from SAP Commerce Cloud?',
            correctCount: 1,
            difficulty: 'medium',
            options: {
              A: 'Binary EDI files',
              B: 'XML or CSV files generated via export jobs or ImpEx',
              C: 'HTML pages scraped by the marketplace',
              D: 'PDF catalogs',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Binary EDI is less common for product feed exports.',
                B: 'Correct. Product data feeds to marketplaces are typically XML or CSV generated from Commerce Cloud.',
                C: 'HTML scraping is not a data feed method.',
                D: 'PDF catalogs are not machine-readable feeds.',
              },
            },
          },
        ],
      },
      {
        name: 'Essential Foundations',
        minQuestions: 0.21,
        maxQuestions: 0.30,
        questions: [
          {
            text: 'What is the SAP Commerce Cloud Type System?',
            correctCount: 1,
            difficulty: 'hard',
            options: {
              A: 'A schema that defines all persistent data models and their relationships',
              B: 'A system for categorizing customer support tickets',
              C: 'The CMS template system for storefront pages',
              D: 'A performance monitoring system for identifying bottlenecks',
            },
            answer: {
              correctOptions: ['A'],
              explanations: {
                A: 'Correct. The Type System is the meta-model that defines all Items, their attributes, and relations in SAP Commerce Cloud.',
                B: 'Support ticket categorization is unrelated.',
                C: 'The CMS template system is a separate concern.',
                D: 'Performance monitoring is a different system.',
              },
            },
          },
          {
            text: 'Which scripting language is used by the SAP Commerce Cloud ServiceLayer for business logic?',
            correctCount: 1,
            difficulty: 'medium',
            options: {
              A: 'Python with Django bindings',
              B: 'Groovy, with support for Java-based Spring beans',
              C: 'JavaScript with Node.js',
              D: 'Kotlin exclusively',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Python is not used in the Commerce Cloud ServiceLayer.',
                B: 'Correct. The SAP Commerce Cloud Scripting Engine supports Groovy, and the platform is built on Java/Spring.',
                C: 'JavaScript/Node.js is not the ServiceLayer language.',
                D: 'Kotlin is not the standard language.',
              },
            },
          },
          {
            text: 'What is the Backoffice Framework in SAP Commerce Cloud?',
            correctCount: 1,
            difficulty: 'medium',
            options: {
              A: 'A REST API framework for backend services',
              B: 'The administration and configuration UI framework built on ZK',
              C: 'A testing framework for integration tests',
              D: 'A CI/CD pipeline configuration tool',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'REST APIs are handled by the OCC layer.',
                B: 'Correct. The Backoffice Framework provides the web-based administration interface for managing all Commerce data.',
                C: 'Testing frameworks are separate.',
                D: 'CI/CD is handled by separate tooling.',
              },
            },
          },
          {
            text: 'What is the role of Spring Framework in SAP Commerce Cloud?',
            correctCount: 1,
            difficulty: 'hard',
            options: {
              A: 'It provides the CMS page rendering engine',
              B: 'It is the dependency injection and application context framework underpinning all platform services',
              C: 'It manages the Solr search index configuration',
              D: 'It handles database migrations automatically',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Page rendering is done by the CMS engine, configured via Spring but not Spring itself.',
                B: 'Correct. Spring IoC and AOP are the core framework the entire SAP Commerce Cloud platform is built on.',
                C: 'Solr configuration is managed separately.',
                D: 'Database migrations in Commerce are managed via the SAP Commerce initialization and update process.',
              },
            },
          },
          {
            text: 'What happens when you run "system update" in SAP Commerce Cloud?',
            correctCount: 1,
            difficulty: 'medium',
            options: {
              A: 'It deploys the latest code from the repository',
              B: 'It applies schema changes and essential data updates without wiping existing data',
              C: 'It restarts the application server',
              D: 'It clears all cached data from Solr',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Code deployment is a separate process.',
                B: 'Correct. System update applies new type system changes and essential data while preserving existing content.',
                C: 'Server restart is separate from system update.',
                D: 'Solr index clearing is a separate operation.',
              },
            },
          },
          {
            text: 'What is Solr used for in SAP Commerce Cloud?',
            correctCount: 1,
            difficulty: 'easy',
            options: {
              A: 'Storing order transaction data',
              B: 'Powering the product search and faceted navigation functionality',
              C: 'Generating AI product recommendations',
              D: 'Managing user authentication tokens',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Orders are stored in the Commerce database.',
                B: 'Correct. Apache Solr is the search engine used for product catalog search and faceted navigation.',
                C: 'AI recommendations are a separate integration.',
                D: 'Authentication uses Spring Security, not Solr.',
              },
            },
          },
          {
            text: 'Which SAP Commerce Cloud environment is intended for testing before production deployment?',
            correctCount: 1,
            difficulty: 'easy',
            options: {
              A: 'Development environment',
              B: 'Staging environment',
              C: 'Production environment',
              D: 'Sandbox environment',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Development is for active development work.',
                B: 'Correct. Staging is the pre-production environment for final validation before go-live.',
                C: 'Production is the live customer-facing environment.',
                D: 'Sandbox typically refers to development/experimentation environments.',
              },
            },
          },
          {
            text: 'What is the purpose of the SAP Commerce Cloud manifest.json file in Cloud deployments?',
            correctCount: 1,
            difficulty: 'hard',
            options: {
              A: 'It defines the product catalog structure for imports',
              B: 'It configures the build and deployment parameters for the SAP Commerce Cloud infrastructure',
              C: 'It maps CMS components to storefront templates',
              D: 'It stores environment variables for the application',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Catalog structure is defined in the type system and ImpEx.',
                B: 'Correct. manifest.json tells the SAP Commerce Cloud build service which extensions, patches, and configurations to include.',
                C: 'CMS mappings are stored in the database.',
                D: 'Environment variables are managed separately via the CCv2 portal or secrets management.',
              },
            },
          },
          {
            text: 'Which of the following is the correct extension model concept in SAP Commerce Cloud?',
            correctCount: 1,
            difficulty: 'medium',
            options: {
              A: 'Extensions are plugins added at runtime without rebuilding',
              B: 'An extension is a modular unit of functionality that compiles into the platform during build',
              C: 'Extensions are third-party apps installed from the SAP App Store',
              D: 'An extension is a CMS template set distributed as a ZIP file',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'Extensions require a build; they are not runtime plugins.',
                B: 'Correct. Extensions are the modular architecture unit — they contain Java code, ImpEx, and configuration compiled into the platform.',
                C: 'While extensions may come from SAP or partners, they are not installed like app store apps.',
                D: 'CMS templates are not what extensions are.',
              },
            },
          },
          {
            text: 'What is Hybris (now SAP Commerce Cloud) known as in the context of commerce platforms?',
            correctCount: 1,
            difficulty: 'easy',
            options: {
              A: 'A lightweight CMS for small businesses',
              B: 'An enterprise-grade omni-channel commerce platform',
              C: 'A mobile-first e-commerce builder for startups',
              D: 'A pure SaaS solution with no on-premise option',
            },
            answer: {
              correctOptions: ['B'],
              explanations: {
                A: 'SAP Commerce Cloud is enterprise-grade, not lightweight for small businesses.',
                B: 'Correct. SAP Commerce Cloud (formerly Hybris) is a leading enterprise omni-channel commerce platform.',
                C: 'It is not specifically a startup-focused mobile builder.',
                D: 'SAP Commerce Cloud offers both cloud and on-premise deployment options.',
              },
            },
          },
        ],
      },
    ],
  },
];

async function main() {
  console.log('🌱 Starting seed...');

  for (const cert of SEED_DATA) {
    console.log(`\nSeeding certification: ${cert.certificationTitle}`);

    // upsert certification + topics
    const existingCert = await prisma.certification.findUnique({ where: { key: cert.certificationKey } });
    if (existingCert) {
      await prisma.certificationTopic.deleteMany({ where: { certificationId: existingCert.id } });
      await prisma.certification.update({
        where: { key: cert.certificationKey },
        data: {
          label: cert.certificationTitle,
          topics: {
            create: cert.topics.map((t) => ({
              name: t.name,
              minQuestions: t.minQuestions,
              maxQuestions: t.maxQuestions,
            })),
          },
        },
      });
    } else {
      await prisma.certification.create({
        data: {
          label: cert.certificationTitle,
          key: cert.certificationKey,
          topics: {
            create: cert.topics.map((t) => ({
              name: t.name,
              minQuestions: t.minQuestions,
              maxQuestions: t.maxQuestions,
            })),
          },
        },
      });
    }

    for (const topic of cert.topics) {
      console.log(`  Topic: ${topic.name} (${topic.questions.length} questions)`);

      for (const q of topic.questions) {
        const created = await prisma.question.create({
          data: {
            certificationTitle: cert.certificationTitle,
            text: q.text,
            correctCount: q.correctCount,
            topic: topic.name,
            difficulty: q.difficulty,
            topicSubarea: null,
          },
        });

        for (const [label, text] of Object.entries(q.options)) {
          await prisma.option.create({
            data: { questionId: created.id, label, text },
          });
        }

        const answer = await prisma.answer.create({
          data: {
            questionId: created.id,
            correctOptions: q.answer.correctOptions,
          },
        });

        for (const [label, text] of Object.entries(q.answer.explanations)) {
          await prisma.explanation.create({
            data: { answerId: answer.id, label, text },
          });
        }
      }
    }
  }

  console.log('\n✅ Seed complete.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
