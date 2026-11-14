import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import 'package:relooka/core/app_colors.dart';
import 'package:relooka/core/app_routes.dart';
import 'package:relooka/core/app_theme.dart';
import 'package:relooka/core/validators.dart';
import 'package:relooka/services/auth_service.dart';
import 'package:relooka/widgets/brand_logo.dart';
import 'package:relooka/widgets/custom_button.dart';
import 'package:relooka/widgets/custom_text_field.dart';
import 'package:relooka/widgets/page_shell.dart';

/// Log in with mobile number, area pincode and Gov ID / Institute ID.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _mobile = TextEditingController();
  final _pincode = TextEditingController();
  final _govId = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _mobile.dispose();
    _pincode.dispose();
    _govId.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthService>();
    final nav = Navigator.of(context);
    setState(() {
      _busy = true;
      _error = null;
    });
    final error = await auth.login(
      mobile: _mobile.text,
      pincode: _pincode.text,
      govId: _govId.text,
    );
    if (!mounted) return;
    setState(() {
      _busy = false;
      _error = error;
    });
    if (error == null) {
      if (nav.canPop()) {
        nav.pop();
      } else {
        nav.pushReplacementNamed(AppRoutes.home);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();

    return PageShell(
      route: null,
      children: [
        Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 440),
            child: Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(18),
              ),
              child: auth.isLoggedIn ? _alreadyIn(auth) : _form(),
            ),
          ),
        ),
      ],
    );
  }

  Widget _alreadyIn(AuthService auth) => Column(
        children: [
          Text('Hi, ${auth.name}', style: AppTheme.heading(size: 26)),
          const SizedBox(height: 20),
          CustomButton(
            label: 'Go to profile',
            expanded: true,
            onPressed: () =>
                Navigator.of(context).pushReplacementNamed(AppRoutes.profile),
          ),
        ],
      );

  Widget _form() => Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Center(child: BrandLogo(size: 34)),
            const SizedBox(height: 18),
            Text('Welcome back', style: AppTheme.heading(size: 26)),
            const SizedBox(height: 4),
            const Text('Log in to rent, list outfits and track orders.',
                style: TextStyle(color: AppColors.textSecondary)),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.accent.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.accent.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.verified_user_outlined, size: 20, color: AppColors.brown),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Demo Account (Instant Test)',
                            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.dark)),
                        Text('Pre-verified renter & customer profile',
                            style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                      ],
                    ),
                  ),
                  TextButton(
                    onPressed: () {
                      setState(() {
                        _mobile.text = '9876543210';
                        _pincode.text = '400050';
                        _govId.text = 'MH0120249876';
                        _error = null;
                      });
                    },
                    child: const Text('Auto-fill',
                        style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.brown)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            CustomTextField(
              label: 'Mobile number',
              hint: '10-digit mobile number',
              controller: _mobile,
              keyboardType: TextInputType.phone,
              prefixIcon: Icons.phone_outlined,
              prefixText: '+91 ',
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(10),
              ],
              validator: Validators.mobile,
            ),
            const SizedBox(height: 14),
            CustomTextField(
              label: 'Area pincode',
              hint: '6-digit pincode',
              controller: _pincode,
              keyboardType: TextInputType.number,
              prefixIcon: Icons.location_on_outlined,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(6),
              ],
              validator: Validators.pincode,
            ),
            const SizedBox(height: 14),
            CustomTextField(
              label: 'Gov ID / Institute ID',
              hint: 'Aadhaar, PAN, college ID...',
              controller: _govId,
              prefixIcon: Icons.badge_outlined,
              textInputAction: TextInputAction.done,
              validator: Validators.govId,
              onSubmitted: (_) => _submit(),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Colors.red)),
            ],
            const SizedBox(height: 22),
            CustomButton(
              label: 'Log in',
              expanded: true,
              loading: _busy,
              onPressed: _submit,
            ),
            const SizedBox(height: 8),
            Center(
              child: TextButton(
                onPressed: () => Navigator.of(context)
                    .pushReplacementNamed(AppRoutes.register),
                child: const Text('New to ReLooka? Create an account'),
              ),
            ),
          ],
        ),
      );
}
