$(document).ready(function () {
    loadSubscriptionPlans();
});

function loadSubscriptionPlans() {
    $.ajax({
        url: '@Url.Action("GetActiveSubscriptions", "Subscriptions")',
        type: 'GET',
        beforeSend: function () {
            $('#subscriptionPlans').html('<div class="col-12 text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>');
        },
        success: function (response) {
            if (response.data && response.data.length > 0) {
                renderSubscriptionPlans(response.data);
            } else {
                $('#subscriptionPlans').html('<div class="col-12 text-center"><p class="text-muted">No subscription plans available at the moment.</p></div>');
            }
        },
        error: function () {
            $('#subscriptionPlans').html('<div class="col-12 text-center"><p class="text-danger">Error loading subscription plans. Please try again later.</p></div>');
        }
    });
}

function renderSubscriptionPlans(plans) {
    let html = '';

    plans.forEach((plan, index) => {
        const isPremium = plan.HasUnlimitedAccess;
        const featuredClass = isPremium ? 'featured' : '';
        const price = plan.Price === 0 ? 'FREE' : `&#x20B1;${plan.Price.toFixed(2)}`;
        const duration = plan.DurationInDays === 1 ? '4 hours' : `${plan.DurationInDays} days`;
        const maxFiles = plan.MaxFileUploads === 0 ? 'Unlimited' : plan.MaxFileUploads;

        html += `
                    <div class="col-md-6">
                        <div class="card subscription-card ${featuredClass}">
                            ${isPremium ? '<div class="position-absolute top-0 end-0 m-3"><span class="badge bg-warning text-dark">Popular</span></div>' : ''}
                            <div class="card-body p-4">
                                <h3 class="card-title fw-bold mb-3">${plan.Name}</h3>
                                <div class="price mb-2">${price}</div>
                                <div class="duration mb-4">${duration}</div>
                                <p class="card-text mb-4">${plan.Description}</p>
                                
                                <ul class="feature-list">
                                    <li>
                                        <i class="ti ti-check fs-5"></i>
                                        <strong>File Uploads:</strong> ${maxFiles} files
                                    </li>
                                    <li>
                                        <i class="ti ti-check fs-5"></i>
                                        <strong>Access Duration:</strong> ${duration}
                                    </li>
                                    <li>
                                        <i class="ti ti-check fs-5"></i>
                                        <strong>Study Groups:</strong> ${isPremium ? 'Unlimited access' : 'Limited access'}
                                    </li>
                                    <li>
                                        <i class="ti ti-check fs-5"></i>
                                        <strong>Features:</strong> ${isPremium ? 'All features' : 'Basic features'}
                                    </li>
                                </ul>
                                
                                <button class="btn ${isPremium ? 'btn-light' : 'btn-primary'} w-100 mt-3" 
                                        onclick="selectPlan(${plan.Id}, '${plan.Name}', ${plan.Price}, ${isPremium})"
                                        id="selectPlanBtn-${plan.Id}">
                                    <i class="ti ti-shopping-cart me-2"></i>
                                    Select Plan
                                </button>
                            </div>
                        </div>
                    </div>
                `;
    });

    $('#subscriptionPlans').html(html);
}

function selectPlan(planId, planName, price, isPremium) {
    // Free plans don't need payment
    if (price === 0) {
        DevExpress.ui.notify({
            message: `You selected ${planName}. This is a free plan!`,
            type: 'info',
            displayTime: 3000,
            position: {
                my: 'top right',
                at: 'top right',
                offset: '-20 20'
            }
        });
        return;
    }

    // Premium plans need payment via Stripe
    if (isPremium && price > 0) {
        const button = $(`#selectPlanBtn-${planId}`);
        button.prop('disabled', true);
        button.html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Processing...');

        $.ajax({
            url: '@Url.Action("CreateCheckoutSession", "Subscriptions")',
            type: 'POST',
            data: {
                subscriptionId: planId,
                __RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val()
            },
            success: function (response) {
                if (response.MessageType) {
                    // Redirect to Stripe Checkout
                    window.location.href = response.Data.checkoutUrl;
                } else {
                    button.prop('disabled', false);
                    button.html('<i class="ti ti-shopping-cart me-2"></i>Select Plan');

                    DevExpress.ui.notify({
                        message: response.Message || 'Failed to create checkout session',
                        type: 'error',
                        displayTime: 3000,
                        position: {
                            my: 'top right',
                            at: 'top right',
                            offset: '-20 20'
                        }
                    });
                }
            },
            error: function () {
                button.prop('disabled', false);
                button.html('<i class="ti ti-shopping-cart me-2"></i>Select Plan');

                DevExpress.ui.notify({
                    message: 'An error occurred. Please try again.',
                    type: 'error',
                    displayTime: 3000,
                    position: {
                        my: 'top right',
                        at: 'top right',
                        offset: '-20 20'
                    }
                });
            }
        });
    }
}