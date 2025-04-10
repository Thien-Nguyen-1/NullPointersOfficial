import uuid
from django.utils import timezone
from django.core.mail import send_mail

from django.contrib.auth import get_user_model
from django.http import HttpResponse

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from rest_framework_simplejwt.tokens import RefreshToken

from returnToWork.models import (
    TermsAndConditions, AdminVerification, User, 
    AudioClip, Document, EmbeddedVideo, Image, ProgressTracker, 
    QuizQuestion, RankingQuestion, Task, UserModuleInteraction, UserResponse
)
from returnToWork.serializers import UserSerializer

class TermsAndConditionsView(APIView):
    """API view for managing Terms and Conditions"""
    def get(self, request):
        """Get the current terms and conditions"""
        try:
            # Get the latest terms and conditions
            terms = TermsAndConditions.objects.latest('updated_at')
            return Response({
                'content': terms.content,
                'last_updated': terms.updated_at
            })
        except TermsAndConditions.DoesNotExist:
            # Return default content if no terms exist yet
            return Response({
                'content': '',
                'last_updated': None
            })
    
    def put(self, request):
        """Update the terms and conditions"""
        # For PUT requests, still require authentication and superadmin role
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, 
                          status=status.HTTP_401_UNAUTHORIZED)
        
        if request.user.user_type != 'superadmin':
            return Response({'error': 'Only superadmins can update terms and conditions'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        content = request.data.get('content')
        if not content:
            return Response({'error': 'Content is required'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        # Create new terms and conditions entry
        terms = TermsAndConditions.objects.create(
            content=content,
            created_by=request.user
        )
        
        return Response({
            'content': terms.content,
            'last_updated': terms.updated_at
        })

class AdminUsersView(APIView):
    """API view for managing admin users"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get list of admin users"""
        # Check if user is a superadmin
        if request.user.user_type != 'superadmin':
            return Response({'error': 'Only superadmins can view admin users'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        # Get all users with user_type='admin'
        admins = User.objects.filter(user_type='admin')
        serializer = UserSerializer(admins, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        """Create a new admin user"""
        # Check if user is a superadmin
        if request.user.user_type != 'superadmin':
            return Response({'error': 'Only superadmins can create admin users'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        # Ensure user_type is set to 'admin'
        data = request.data.copy()
        data['user_type'] = 'admin'
        
        # Check if email verification is required:
        require_verification = data.get('require_verification', True)
        try:
            #convert string value to boolean
            if isinstance(require_verification, str):
                require_verification = require_verification.lower() == 'true'
        except:
            require_verification == True

        try: 
            # Extract required fields
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')
            first_name = data.get('first_name', '')
            last_name = data.get('last_name', '')

            # validate required fields:
            if not all([username, email, password]):
                return Response({'error': 'Username, email and password are required'},
                                status=status.HTTP_400_BAD_REQUEST)
            
            # check if user already exists
            if User.objects.filter(username=username).exists(): # usrname checking
                return Response({'error': 'Username already exists'}, 
                            status=status.HTTP_400_BAD_REQUEST)
            
            if User.objects.filter(email=email).exists(): # email checking
                return Response({'error': 'Email already exists'}, 
                            status=status.HTTP_400_BAD_REQUEST)
            
            # Create user with create_user to properly hash password
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                user_type='admin',
                terms_accepted=True  # Default for admin users
            )
            
            if require_verification:
                # Create verification entry
                verification_token = str(uuid.uuid4())
                AdminVerification.objects.create(
                    admin=user,
                    is_verified=False,
                    verification_token=verification_token
                )
                
                # === VERIFICATION EMAIL FOR ADMIN IS OPTIONAL SINCE SUPERADMIN CREATES THEM === #
                # Send verification email
                verification_url = f"http://localhost:5173/verify-admin-email/{verification_token}/"
                print(f"Sending admin verification email to: {email}")
                print(f"Verification URL: {verification_url}")
                
                send_mail(
                    subject="Verify your admin account",
                    message=f"Dear {user.first_name},\n\nYou've been added as an admin by a superadmin. Please verify your email by clicking the following link: {verification_url}\n\nThis link will expire in 3 days.",
                    from_email="readiness.to.return.to.work@gmail.com",
                    recipient_list=[email],
                    fail_silently=False,
                )

                print("Email sent successfully")
            else:
                # If verification not required, create verified admin
                AdminVerification.objects.create(
                    admin=user,
                    is_verified=True
                )
            
            # Return the created user with JWT tokens for immediate login if not requiring verification
            if not require_verification:
                refresh = RefreshToken.for_user(user)
                return Response({
                    'user': UserSerializer(user).data,
                    'tokens': {
                        'access': str(refresh.access_token),
                        'refresh': str(refresh)
                    }
                }, status=status.HTTP_201_CREATED)
            else:
                # Just return the user data without tokens
                return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class AdminEmailVerificationView(APIView):
    """API view for admin email verification"""
    permission_classes = []  # no authentication required for verification
    
    def get(self, request, token):
        """Verify admin email using token"""
        try:
            # find verification record with this token
            verification = AdminVerification.objects.get(verification_token=token)
            admin_user = verification.admin

            # If already verified, return a success message
            if verification.is_verified:
                return Response({
                    'message': 'Email already verified. You can now log in as an admin.',
                    'redirect_url': '/login'
                })
            
            # check if token is expired
            if verification.is_token_expired():
                return Response({
                    'error': 'Verification token has expired. Please request a new one.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # ensure the user is actually an admin
            if verification.admin.user_type != 'admin':
                return Response({
                    'error': 'This verification link is only valid for admin users.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Mark as verified and clear token
            verification.is_verified = True
            verification.save()
            
            # Generate JWT tokens for immediate login
            refresh = RefreshToken.for_user(verification.admin)
            
            # Redirect to login or a success page
            return Response({
                'message': 'Email verified successfully. You can now log in as an admin.',
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                },
                'redirect_url': '/login'
            })
        except AdminVerification.DoesNotExist:
            return Response({
                'error': 'Invalid or expired verification token'
            }, status=status.HTTP_400_BAD_REQUEST)

class ResendAdminVerificationView(APIView):
    """API view to resend admin verification emails"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, user_id):
        """Resend verification email to admin"""
        # Check if user is a superadmin
        if request.user.user_type != 'superadmin':
            return Response({'error': 'Only superadmins can resend verification emails'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Get the admin user
            admin = User.objects.get(id=user_id, user_type='admin')
            
            # Get or create verification record
            verification, created = AdminVerification.objects.get_or_create(
                admin=admin,
                defaults={'is_verified': False}
            )
            
            # Check if already verified
            if verification.is_verified:
                return Response({'error': 'User is already verified'}, 
                               status=status.HTTP_400_BAD_REQUEST)
            
            # Generate new verification token
            verification.verification_token = str(uuid.uuid4())
            verification.token_created_at = timezone.now()
            verification.save()
            
            # Send verification email
            verification_url = f"http://localhost:5173/verify-admin-email/{verification.verification_token}/"
            
            send_mail(
                subject="Verify your admin account - Reminder",
                message=f"Dear {admin.first_name},\n\nThis is a reminder to verify your admin account. Please click the following link to verify your email: {verification_url}\n\nThis link will expire in 3 days.",
                from_email="readiness.to.return.to.work@gmail.com",
                recipient_list=[admin.email],
                fail_silently=False,
            )
            
            return Response({
                'message': f'Verification email resent to {admin.email}',
                'email': admin.email
            })
            
        except User.DoesNotExist:
            return Response({'error': 'Admin user not found'}, 
                           status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, 
                           status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AdminUserDetailView(APIView):
    """API view for managing individual admin users"""
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, user_id):
        """Delete an admin user"""
        # Check if user is a superadmin

        if request.user.user_type != 'superadmin':
            return Response({'error': 'Only superadmins can delete admin users'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        try:
            admin_to_delete = User.objects.get(id=user_id, user_type='admin')
            

            # Identify the superadmin (current user) 
            superadmin = request.user

            # find all content authored by this admin
            # check all content types that have author relationship
            from django.db import transaction
        
            # Use a transaction to ensure all operations are atomic
            with transaction.atomic():
                # 1. Check if the ADMIN user is associated with any modules
                # if using a many-to-many relationship
                module_count = 0
                if hasattr(admin_to_delete, 'module'):
                    module_count = admin_to_delete.module.count()
                    # for many-to-many relationships, just need to ensure the superadmin
                    # also has these modules associated, not necessarily transfer ownership
                    if module_count > 0:
                        # add the modules to the superadmin's list if not already there
                        for module in admin_to_delete.module.all():
                            if not superadmin.module.filter(id=module.id).exists():
                                superadmin.module.add(module)
                
                # 2. Transfer authorship for each content type
                # for each content type that has an author field, update it
                
                # trasfer ownership of Task content
                tasks = Task.objects.filter(author=admin_to_delete)
                task_count = tasks.count()
                if task_count > 0:
                    tasks.update(author=superadmin)
                
                # Transfer ownership of RankingQuestion content
                ranking_questions = RankingQuestion.objects.filter(author=admin_to_delete)
                rq_count = ranking_questions.count()
                if rq_count > 0:
                    ranking_questions.update(author=superadmin)
                
                # Transfer ownership of InlinePicture content
                inline_pictures = Image.objects.filter(author=admin_to_delete)
                ip_count = inline_pictures.count()
                if ip_count > 0:
                    inline_pictures.update(author=superadmin)
                
                # Transfer ownership of AudioClip content
                audio_clips = AudioClip.objects.filter(author=admin_to_delete)
                ac_count = audio_clips.count()
                if ac_count > 0:
                    audio_clips.update(author=superadmin)
                
                # Transfer ownership of Document content
                documents = Document.objects.filter(author=admin_to_delete)
                doc_count = documents.count()
                if doc_count > 0:
                    documents.update(author=superadmin)
                
                # Transfer ownership of EmbeddedVideo content
                videos = EmbeddedVideo.objects.filter(author=admin_to_delete)
                video_count = videos.count()
                if video_count > 0:
                    videos.update(author=superadmin)
                
                # Transfer ownership of InfoSheet content
                # infosheets = Infosheet.objects.filter(author=admin_to_delete)
                # infosheet_count = infosheets.count()
                # if infosheet_count > 0:
                #     print(f"[DEBUG] Transferring {infosheet_count} InfoSheet items")
                #     infosheets.update(author=superadmin)
                
                # # Transfer ownership of Video content
                # video_content = Video.objects.filter(author=admin_to_delete)
                # video_content_count = video_content.count()
                # if video_content_count > 0:
                #     print(f"[DEBUG] Transferring {video_content_count} Video items")
                #     video_content.update(author=superadmin)
                
                # Update any terms and conditions created by this admin_to_delete
                terms = TermsAndConditions.objects.filter(created_by=admin_to_delete)
                terms_count = terms.count()
                if terms_count > 0:
                    terms.update(created_by=superadmin)
                
                # 3. Check for UserModuleInteraction and ProgressTracker 
                user_interactions = UserModuleInteraction.objects.filter(user=admin_to_delete)
                ui_count = user_interactions.count()
                if ui_count > 0:
                    # For user interactions, it's probably better to delete them
                    # since these are personal interactions not ownership
                    user_interactions.delete()
                
                progress_trackers = ProgressTracker.objects.filter(user=admin_to_delete)
                pt_count = progress_trackers.count()
                if pt_count > 0:
                    # For progress trackers, also better to delete
                    progress_trackers.delete()
                
                # 4. Check for UserResponse records
                user_responses = UserResponse.objects.filter(user=admin_to_delete)
                ur_count = user_responses.count()
                if ur_count > 0:
                    user_responses.delete()
                
                # Store admin_to_delete name for the response message
                admin_name = f"{admin_to_delete.first_name} {admin_to_delete.last_name}"
                admin_username = admin_to_delete.username
                
                # Finally, delete the admin_to_delete user after transferring all content
                admin_to_delete.delete()
                
                # Return a 200 OK with detailed information instead of 204 No Content
                # This allows the frontend to display more informative feedback
                return Response({
                    'status': 'success', 
                    'message': f'Admin user {admin_name} ({admin_username}) deleted successfully. All content transferred to your account.',
                    'transferred_items': {
                        'modules': module_count,
                        'tasks': task_count,
                        'ranking_questions': rq_count,
                        'inline_pictures': ip_count,
                        'audio_clips': ac_count,
                        'documents': doc_count,
                        # 'videos': video_count + video_content_count,
                        # 'infosheets': infosheet_count,
                        'videos': video_count,
                        'terms': terms_count
                    },
                    'deleted_items': {
                        'user_interactions': ui_count,
                        'progress_trackers': pt_count,
                        'user_responses': ur_count
                    }
                }, status=status.HTTP_200_OK)
                
        except User.DoesNotExist:
            return Response({'error': 'Admin user not found'}, 
                           status=status.HTTP_404_NOT_FOUND)
        
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': f'An error occurred: {str(e)}'}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CheckSuperAdminView(APIView):
    """API view to check if the current user is a superadmin"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Check if current user is a superadmin"""
        is_superadmin = request.user.user_type == 'superadmin'
        return Response({'isSuperAdmin': is_superadmin})
    
class AcceptTermsView(APIView):
    """API view for users to accept terms and conditions"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Mark the current user as having accepted the terms"""
        user = request.user
        
        user.terms_accepted = True
        user.save()
        
        return Response({
            'message': 'Terms and conditions accepted',
            'user': UserSerializer(user).data
        })
