"""
customers/serializers.py
------------------------
CustomerSerializer     – full read serializer (includes customer_id, full_name)
CustomerWriteSerializer – write serializer with all business-rule validations
CustomerListSerializer  – lightweight serializer for list/table views
"""
from rest_framework import serializers
from .models import Customer


# ---------------------------------------------------------------------------
# Read – full detail
# ---------------------------------------------------------------------------

class CustomerSerializer(serializers.ModelSerializer):
    customer_id      = serializers.CharField(read_only=True)
    full_name        = serializers.CharField(read_only=True)
    created_by_name  = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Customer
        fields = (
            'id', 'customer_id', 'full_name',
            'first_name', 'last_name', 'gender', 'date_of_birth',
            'email', 'phone_number',
            'address', 'city', 'state', 'country', 'postal_code',
            'customer_type', 'company_name',
            'profile_image', 'notes', 'status',
            'created_by', 'created_by_name',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'customer_id', 'full_name', 'created_at', 'updated_at', 'created_by')

    def get_created_by_name(self, obj):
        if obj.created_by:
            name = f'{obj.created_by.first_name} {obj.created_by.last_name}'.strip()
            return name or obj.created_by.email
        return None


# ---------------------------------------------------------------------------
# Read – lightweight list
# ---------------------------------------------------------------------------

class CustomerListSerializer(serializers.ModelSerializer):
    customer_id = serializers.CharField(read_only=True)
    full_name   = serializers.CharField(read_only=True)

    class Meta:
        model = Customer
        fields = (
            'id', 'customer_id', 'full_name',
            'first_name', 'last_name',
            'email', 'phone_number',
            'customer_type', 'company_name',
            'city', 'status', 'profile_image',
            'created_at',
        )


# ---------------------------------------------------------------------------
# Write – create / update with full validation
# ---------------------------------------------------------------------------

class CustomerWriteSerializer(serializers.ModelSerializer):

    class Meta:
        model = Customer
        fields = (
            'first_name', 'last_name', 'gender', 'date_of_birth',
            'email', 'phone_number',
            'address', 'city', 'state', 'country', 'postal_code',
            'customer_type', 'company_name',
            'profile_image', 'notes', 'status',
        )
        extra_kwargs = {
            'first_name':    {'required': True,  'allow_blank': False},
            'last_name':     {'required': True,  'allow_blank': False},
            'email':         {'required': True},
            'phone_number':  {'required': True,  'allow_blank': False},
            'customer_type': {'required': True},
        }

    # ── Field-level ─────────────────────────────────────────────

    def validate_email(self, value):
        qs = Customer.objects.filter(email__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('A customer with this email already exists.')
        return value.lower()

    def validate_phone_number(self, value):
        # Basic phone validation: digits, spaces, +, -, ()
        import re
        cleaned = re.sub(r'[\s\-\(\)]', '', value)
        if not re.match(r'^\+?\d{7,15}$', cleaned):
            raise serializers.ValidationError('Enter a valid phone number (7–15 digits).')
        qs = Customer.objects.filter(phone_number=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('A customer with this phone number already exists.')
        return value

    def validate(self, attrs):
        # Business customers should ideally have a company name (soft warning via note, not hard block)
        return attrs

    def create(self, validated_data):
        return Customer.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
