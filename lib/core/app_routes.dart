import 'package:flutter/material.dart';

import 'package:relooka/models/product_model.dart';
import 'package:relooka/screens/about_screen.dart';
import 'package:relooka/screens/cart_screen.dart';
import 'package:relooka/screens/explore_screen.dart';
import 'package:relooka/screens/home_screen.dart';
import 'package:relooka/screens/list_outfit_screen.dart';
import 'package:relooka/screens/login_screen.dart';
import 'package:relooka/screens/product_detail_screen.dart';
import 'package:relooka/screens/profile_screen.dart';
import 'package:relooka/screens/register_screen.dart';
import 'package:relooka/screens/renter_screen.dart';
import 'package:relooka/screens/rent_screen.dart';

/// Navigation between screens.
class AppRoutes {
  AppRoutes._();

  static const home = '/';
  static const explore = '/explore';
  static const rent = '/rent';
  static const renter = '/renter';

  /// Camera-verified form to list an outfit (opened from the Renter page).
  static const list = '/list';
  static const about = '/about';
  static const cart = '/cart';
  static const login = '/login';
  static const register = '/register';
  static const profile = '/profile';

  /// Pass a [Product] as the route argument.
  static const product = '/product';

  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    Widget page;
    switch (settings.name) {
      case home:
        page = const HomeScreen();
        break;
      case explore:
        page = ExploreScreen(initialQuery: settings.arguments as String?);
        break;
      case rent:
        page = const RentScreen();
        break;
      case renter:
        page = const RenterScreen();
        break;
      case list:
        page = const ListOutfitScreen();
        break;
      case about:
        page = const AboutScreen();
        break;
      case cart:
        page = const CartScreen();
        break;
      case login:
        page = const LoginScreen();
        break;
      case register:
        page = const RegisterScreen();
        break;
      case profile:
        page = const ProfileScreen();
        break;
      case product:
        final args = settings.arguments;
        page = args is Product
            ? ProductDetailScreen(product: args)
            : const HomeScreen();
        break;
      default:
        page = const HomeScreen();
    }

    // Top-level tabs swap with a soft fade; other pages slide normally.
    const tabs = {home, explore, rent, renter, about};
    if (tabs.contains(settings.name)) {
      return PageRouteBuilder(
        settings: settings,
        pageBuilder: (_, __, ___) => page,
        transitionDuration: const Duration(milliseconds: 180),
        transitionsBuilder: (_, anim, __, child) =>
            FadeTransition(opacity: anim, child: child),
      );
    }
    return MaterialPageRoute(settings: settings, builder: (_) => page);
  }
}
