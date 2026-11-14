import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:relooka/core/app_routes.dart';
import 'package:relooka/core/app_theme.dart';
import 'package:relooka/providers/cart_provider.dart';
import 'package:relooka/providers/listing_provider.dart';
import 'package:relooka/providers/order_provider.dart';
import 'package:relooka/services/auth_service.dart';
import 'package:relooka/services/product_service.dart';

class ReLookaApp extends StatelessWidget {
  const ReLookaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => CartProvider()),
        ChangeNotifierProvider(create: (_) => AuthService()),
        ChangeNotifierProvider(create: (_) => OrderProvider()),
        ChangeNotifierProvider(create: (_) => ListingProvider()),
        Provider(create: (_) => ProductService()),
      ],
      child: MaterialApp(
        title: 'ReLooka',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        initialRoute: AppRoutes.home,
        onGenerateRoute: AppRoutes.onGenerateRoute,
      ),
    );
  }
}
