# """Unit tests for the User model."""
# from django.core.exceptions import ValidationError
# from django.test import TestCase
# from returnToWork.models import User

# class UserModelTestCase(TestCase):
#     """Unit tests for the User model."""

#     fixtures = [
#         'returnToWork/tests/fixtures/default_user.json',
#         'returnToWork/tests/fixtures/other_users.json'
#     ]

    
    def setUp(self):
        # self.user = User.objects.get(username='@johndoe')
        self.user = User.objects.create_user(
            username = '@jackdoe',
            first_name = 'Jack',
            last_name = 'Doe',
            email = 'jackdoe@example.org',
            password = 'SecurePass123',
            user_type ='admin',
            firebase_token='test_token_123',
        )

#     def test_valid_user(self):
#         self._assert_user_is_valid()

#     def test_username_cannot_be_blank(self):
#         self.user.username = ''
#         self._assert_user_is_invalid()

#     def test_username_can_be_30_characters_long(self):
#         self.user.username = '@' + 'x' * 29
#         self._assert_user_is_valid()

#     def test_username_cannot_be_over_30_characters_long(self):
#         self.user.username = '@' + 'x' * 30
#         self._assert_user_is_invalid()

#     def test_username_must_be_unique(self):
#         second_user = User.objects.get(username='@janedoe')
#         self.user.username = second_user.username
#         self._assert_user_is_invalid()

#     def test_username_must_start_with_at_symbol(self):
#         self.user.username = 'johndoe'
#         self._assert_user_is_invalid()

#     def test_username_must_contain_only_alphanumericals_after_at(self):
#         self.user.username = '@john!doe'
#         self._assert_user_is_invalid()

#     def test_username_must_contain_at_least_3_alphanumericals_after_at(self):
#         self.user.username = '@jo'
#         self._assert_user_is_invalid()

#     def test_username_may_contain_numbers(self):
#         self.user.username = '@j0hndoe2'
#         self._assert_user_is_valid()

#     def test_username_must_contain_only_one_at(self):
#         self.user.username = '@@johndoe'
#         self._assert_user_is_invalid()


#     def test_first_name_must_not_be_blank(self):
#         self.user.first_name = ''
#         self._assert_user_is_invalid()

#     def test_first_name_need_not_be_unique(self):
#         second_user = User.objects.get(username='@janedoe')
#         self.user.first_name = second_user.first_name
#         self._assert_user_is_valid()

#     def test_first_name_may_contain_50_characters(self):
#         self.user.first_name = 'x' * 50
#         self._assert_user_is_valid()

#     def test_first_name_must_not_contain_more_than_50_characters(self):
#         self.user.first_name = 'x' * 51
#         self._assert_user_is_invalid()


#     def test_last_name_must_not_be_blank(self):
#         self.user.last_name = ''
#         self._assert_user_is_invalid()

#     def test_last_name_need_not_be_unique(self):
#         second_user = User.objects.get(username='@janedoe')
#         self.user.last_name = second_user.last_name
#         self._assert_user_is_valid()

#     def test_last_name_may_contain_50_characters(self):
#         self.user.last_name = 'x' * 50
#         self._assert_user_is_valid()

#     def test_last_name_must_not_contain_more_than_50_characters(self):
#         self.user.last_name = 'x' * 51
#         self._assert_user_is_invalid()


#     def test_email_must_not_be_blank(self):
#         self.user.email = ''
#         self._assert_user_is_invalid()

#     def test_email_must_be_unique(self):
#         second_user = User.objects.get(username='@janedoe')
#         self.user.email = second_user.email
#         self._assert_user_is_invalid()

#     def test_email_must_contain_username(self):
#         self.user.email = '@example.org'
#         self._assert_user_is_invalid()

#     def test_email_must_contain_at_symbol(self):
#         self.user.email = 'johndoe.example.org'
#         self._assert_user_is_invalid()

#     def test_email_must_contain_domain_name(self):
#         self.user.email = 'johndoe@.org'
#         self._assert_user_is_invalid()

#     def test_email_must_contain_domain(self):
#         self.user.email = 'johndoe@example'
#         self._assert_user_is_invalid()

#     def test_email_must_not_contain_more_than_one_at(self):
#         self.user.email = 'johndoe@@example.org'
#         self._assert_user_is_invalid()


#     def test_full_name_must_be_correct(self):
#         full_name = self.user.full_name()
#         self.assertEqual(full_name, "Jack Doe")


#     def test_user_type_must_be_valid_choice(self):
#         self.user.user_type = 'invalid_role'
#         self._assert_user_is_invalid()


#     def _assert_user_is_valid(self):
#         try:
#             self.user.full_clean()
#         except (ValidationError):
#             self.fail('Test user should be valid')

#     def _assert_user_is_invalid(self):
#         with self.assertRaises(ValidationError):
#             self.user.full_clean()


#     def test_string_representation(self):
#         expected_string =  f"{self.user.full_name()} - {self.user.username} - {self.user.user_id}"
#         actual_string = str(self.user)
#         self.assertEqual(actual_string, expected_string)
    