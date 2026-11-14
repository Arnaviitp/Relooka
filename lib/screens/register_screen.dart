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

/// Two-step sign-up.
/// Step 1: name, email, mobile, password, confirm password.
/// Step 2: location pincode and gender.
class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  static const _genders = ['Female', 'Male', 'Other', 'Prefer not to say'];

  final _step1Key = GlobalKey<FormState>();
  final _step2Key = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _mobile = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  final _pincode = TextEditingController();

  int _step = 0;
  String? _gender;
  String? _genderError;
  String? _error;
  bool _busy = false;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _mobile.dispose();
    _password.dispose();
    _confirm.dispose();
    _pincode.dispose();
    super.dispose();
  }

  void _next() {
    if (!_step1Key.currentState!.validate()) return;
    setState(() {
      _step = 1;
      _error = null;
    });
  }

  Future<void> _submit() async {
    final okForm = _step2Key.currentState!.validate();
    if (_gender == null) {
      setState(() => _genderError = 'Please select an option');
    }
    if (!okForm || _gender == null) return;

    final auth = context.read<AuthService>();
    final nav = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);
    setState(() {
      _busy = true;
      _error = null;
      _genderError = null;
    });
    final error = await auth.register(
      name: _name.text,
      email: _email.text,
      mobile: _mobile.text,
      password: _password.text,
      pincode: _pincode.text,
      gender: _gender!,
    );
    if (!mounted) return;
    setState(() {
      _busy = false;
      _error = error;
    });
    if (error == null) {
      messenger.showSnackBar(SnackBar(
        content: Text(
            'Welcome to ReLooka! Your ID is ${auth.user?.reLookaId ?? ''}'),
      ));
      nav.pushNamedAndRemoveUntil(AppRoutes.home, (_) => false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return PageShell(
      route: null,
      children: [
        Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 460),
            child: Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(18),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Center(child: BrandLogo(size: 34)),
                  const SizedBox(height: 18),
                  Text('Create your account',
                      style: AppTheme.heading(size: 26)),
                  const SizedBox(height: 6),
                  Text('Step ${_step + 1} of 2 · '
                      '${_step == 0 ? 'Your details' : 'Location & gender'}',
                      style:
                          const TextStyle(color: AppColors.textSecondary)),
                  const SizedBox(height: 12),
                  _progress(),
                  const SizedBox(height: 22),
                  if (_step == 0) _stepOne() else _stepTwo(),
                  const SizedBox(height: 8),
                  Center(
                    child: TextButton(
                      onPressed: () => Navigator.of(context)
                          .pushReplacementNamed(AppRoutes.login),
                      child: const Text('Already have an account? Log in'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _progress() => Row(children: [
        for (var i = 0; i < 2; i++) ...[
          Expanded(
            child: Container(
              height: 5,
              decoration: BoxDecoration(
                color: i <= _step ? AppColors.accent : AppColors.border,
                borderRadius: BorderRadius.circular(3),
              ),
            ),
          ),
          if (i == 0) const SizedBox(width: 8),
        ],
      ]);

  Widget _stepOne() => Form(
        key: _step1Key,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CustomTextField(
              label: 'Name',
              controller: _name,
              prefixIcon: Icons.person_outline,
              textInputAction: TextInputAction.next,
              validator: Validators.name,
            ),
            const SizedBox(height: 14),
            CustomTextField(
              label: 'Email',
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              prefixIcon: Icons.mail_outline,
              textInputAction: TextInputAction.next,
              validator: Validators.email,
            ),
            const SizedBox(height: 14),
            CustomTextField(
              label: 'Mobile number',
              hint: '10-digit mobile number',
              controller: _mobile,
              keyboardType: TextInputType.phone,
              prefixIcon: Icons.phone_outlined,
              prefixText: '+91 ',
              textInputAction: TextInputAction.next,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(10),
              ],
              validator: Validators.mobile,
            ),
            const SizedBox(height: 14),
            CustomTextField(
              label: 'Password',
              hint: 'At least 8 characters, letters and numbers',
              controller: _password,
              obscureText: true,
              prefixIcon: Icons.lock_outline,
              textInputAction: TextInputAction.next,
              validator: Validators.password,
            ),
            const SizedBox(height: 14),
            CustomTextField(
              label: 'Confirm password',
              controller: _confirm,
              obscureText: true,
              prefixIcon: Icons.lock_outline,
              textInputAction: TextInputAction.done,
              validator: (v) => Validators.confirmPassword(v, _password.text),
              onSubmitted: (_) => _next(),
            ),
            const SizedBox(height: 22),
            CustomButton(
              label: 'Next',
              trailingIcon: Icons.arrow_forward,
              expanded: true,
              onPressed: _next,
            ),
          ],
        ),
      );

  Widget _stepTwo() => Form(
        key: _step2Key,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CustomTextField(
              label: 'Location pincode',
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
            const SizedBox(height: 18),
            const Text('Gender',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final g in _genders)
                  ChoiceChip(
                    label: Text(g),
                    selected: _gender == g,
                    selectedColor: AppColors.dark,
                    showCheckmark: false,
                    labelStyle: TextStyle(
                        color:
                            _gender == g ? Colors.white : AppColors.textPrimary),
                    onSelected: (_) => setState(() {
                      _gender = g;
                      _genderError = null;
                    }),
                  ),
              ],
            ),
            if (_genderError != null)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(_genderError!,
                    style: const TextStyle(color: Colors.red, fontSize: 12)),
              ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Colors.red)),
            ],
            const SizedBox(height: 22),
            Row(children: [
              Expanded(
                child: CustomButton(
                  label: 'Back',
                  style: CustomButtonStyle.outline,
                  onPressed: _busy ? null : () => setState(() => _step = 0),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: CustomButton(
                  label: 'Create account',
                  loading: _busy,
                  onPressed: _submit,
                ),
              ),
            ]),
          ],
        ),
      );
}
