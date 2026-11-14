import 'package:flutter/material.dart';

import 'package:relooka/core/app_colors.dart';
import 'package:relooka/core/app_routes.dart';
import 'package:relooka/core/app_theme.dart';
import 'package:relooka/widgets/brand_logo.dart';
import 'package:relooka/widgets/custom_button.dart';
import 'package:relooka/widgets/page_shell.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return PageShell(
      route: AppRoutes.about,
      children: [
        Row(children: [
          Text('About ', style: AppTheme.heading(size: 40)),
          const BrandLogo(size: 40),
        ]),
        const SizedBox(height: 16),
        const Text(
          'ReLooka is a rental platform for ethnic wear. Rent an outfit for '
          'a special occasion, or list the pieces sitting in your wardrobe '
          'so they can be worn and loved again.\n\n'
          'Every listing is verified with live camera photos, and every '
          'outfit is cleaned and quality-checked, so you can look good while '
          'keeping fashion circular.',
          style: TextStyle(
              fontSize: 17, height: 1.6, color: AppColors.textSecondary),
        ),
        const SizedBox(height: 24),
        Wrap(spacing: 12, runSpacing: 12, children: [
          CustomButton(
            label: 'Start Renting',
            onPressed: () =>
                Navigator.of(context).pushReplacementNamed(AppRoutes.rent),
          ),
          CustomButton(
            label: 'Become a Renter',
            style: CustomButtonStyle.outline,
            onPressed: () =>
                Navigator.of(context).pushReplacementNamed(AppRoutes.renter),
          ),
        ]),
        const SizedBox(height: 40),
        const FeatureStrip(items: [
          FeatureItem(Icons.event_available_outlined, 'Flexible Rentals',
              'Choose the duration that fits you'),
          FeatureItem(Icons.verified_user_outlined, 'Quality Assured',
              'Clean, well-maintained outfits'),
          FeatureItem(Icons.eco_outlined, 'Sustainable Fashion',
              'Look good while reducing waste'),
        ]),
      ],
    );
  }
}
