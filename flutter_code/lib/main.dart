import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'core/theme.dart';

// Note: These providers and screens need to be implemented
// in their respective files to complete the migration.
// import 'providers/auth_provider.dart';
// import 'providers/cart_provider.dart';
// import 'providers/bookmark_provider.dart';
// import 'providers/theme_provider.dart';

// Example screen imports
// import 'screens/home_page.dart';
// import 'screens/saved_page.dart';

void main() {
  runApp(
    // MultiProvider(
    //   providers: [
    //     ChangeNotifierProvider(create: (_) => ThemeProvider()),
    //     ChangeNotifierProvider(create: (_) => AuthProvider()),
    //     ChangeNotifierProvider(create: (_) => BookmarkProvider()),
    //     ChangeNotifierProvider(create: (_) => CartProvider()),
    //   ],
    //   child: const MediGenApp(),
    // ),
    const MediGenApp()
  );
}

final _router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const Placeholder(child: Text("Home Page")),
    ),
    // Additional routes can be uncommented as you translate the pages
    /*
    GoRoute(
      path: '/saved',
      builder: (context, state) => const SavedPage(),
    ),
    GoRoute(
      path: '/cart',
      builder: (context, state) => const CartPage(),
    ),
    GoRoute(
      path: '/checkout',
      builder: (context, state) => const CheckoutPage(),
    ),
    GoRoute(
      path: '/stores',
      builder: (context, state) => const StoresPage(),
    ),
    GoRoute(
      path: '/track-order',
      builder: (context, state) => const OrderTrackingPage(),
    ),
    GoRoute(
      path: '/medicine/:id',
      builder: (context, state) {
        final id = state.pathParameters['id']!;
        return MedicineDetailPage(medicineId: id);
      },
    ),
    */
  ],
);

class MediGenApp extends StatelessWidget {
  const MediGenApp({super.key});

  @override
  Widget build(BuildContext context) {
    // final themeProvider = Provider.of<ThemeProvider>(context);
    
    return MaterialApp.router(
      title: 'MediGen',
      debugShowCheckedModeBanner: false,
      // themeMode: themeProvider.themeMode,
      themeMode: ThemeMode.light,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: AppColors.primary),
        scaffoldBackgroundColor: AppColors.background,
        textTheme: GoogleFonts.outfitTextTheme(),
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.primary,
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: AppColors.dark,
        textTheme: GoogleFonts.outfitTextTheme(ThemeData.dark().textTheme),
      ),
      routerConfig: _router,
    );
  }
}
