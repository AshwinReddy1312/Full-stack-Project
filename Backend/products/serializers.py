"""
products/serializers.py
-----------------------
Serializers for ProductCategory and Product.
ProductSerializer includes nested category name for read operations
and validates business rules (price, stock).
"""
from rest_framework import serializers
from .models import Product, ProductCategory


# ---------------------------------------------------------------------------
# Category
# ---------------------------------------------------------------------------

class ProductCategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ProductCategory
        fields = ('id', 'name', 'description', 'product_count', 'created_at')
        read_only_fields = ('id', 'created_at')

    def get_product_count(self, obj):
        return obj.products.count()

    def validate_name(self, value):
        """Category names must be unique (case-insensitive), excluding the current instance."""
        qs = ProductCategory.objects.filter(name__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('A category with this name already exists.')
        return value


# ---------------------------------------------------------------------------
# Product – list / detail representation (read-heavy, includes nested data)
# ---------------------------------------------------------------------------

class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer used in list views and tables."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    created_by_name = serializers.SerializerMethodField(read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'sku', 'barcode',
            'category', 'category_name',
            'cost_price', 'selling_price',
            'stock_quantity', 'minimum_stock', 'is_low_stock',
            'product_image', 'status',
            'created_by', 'created_by_name',
            'created_at', 'updated_at',
        )

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f'{obj.created_by.first_name} {obj.created_by.last_name}'.strip() or obj.created_by.email
        return None


# ---------------------------------------------------------------------------
# Product – write serializer (create / update)
# ---------------------------------------------------------------------------

class ProductWriteSerializer(serializers.ModelSerializer):
    """Used for POST and PUT requests. Runs full business-rule validation."""

    class Meta:
        model = Product
        fields = (
            'name', 'sku', 'barcode', 'description',
            'category',
            'cost_price', 'selling_price',
            'stock_quantity', 'minimum_stock',
            'product_image', 'status',
        )

    # --- Field-level validation ---

    def validate_sku(self, value):
        """SKU must be globally unique, excluding the current instance on update."""
        qs = Product.objects.filter(sku__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('A product with this SKU already exists.')
        return value

    def validate_cost_price(self, value):
        if value < 0:
            raise serializers.ValidationError('Cost price cannot be negative.')
        return value

    def validate_selling_price(self, value):
        if value < 0:
            raise serializers.ValidationError('Selling price cannot be negative.')
        return value

    def validate_stock_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError('Stock quantity cannot be negative.')
        return value

    def validate_minimum_stock(self, value):
        if value < 0:
            raise serializers.ValidationError('Minimum stock cannot be negative.')
        return value

    # --- Cross-field validation ---

    def validate(self, attrs):
        cost = attrs.get('cost_price', getattr(self.instance, 'cost_price', None))
        selling = attrs.get('selling_price', getattr(self.instance, 'selling_price', None))

        if cost is not None and selling is not None:
            if selling <= cost:
                raise serializers.ValidationError({
                    'selling_price': 'Selling price must be greater than cost price.'
                })
        return attrs

    def create(self, validated_data):
        # created_by is injected by the view from request.user
        return Product.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
